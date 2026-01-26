/**
 * Branch Manager Module
 *
 * Manages message branching and rollback functionality.
 *
 * Key features:
 * - Create new branches from any message
 * - Switch between branches
 * - Get branch tree structure
 * - Find all branches for a room
 */

import { eq, and, isNull, desc } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";

import { messages } from "../schema";

/**
 * Branch information
 */
export interface Branch {
  branch_name: string;
  message_count: number;
  last_message_id: number;
  created_at: Date;
  is_active: boolean;
}

/**
 * Message node in the tree structure
 */
export interface MessageNode {
  message_id: number;
  role: string;
  content: string;
  parent_message_id: number | null;
  branch_name: string | null;
  is_active_branch: boolean;
  created_at: Date;
  children: MessageNode[];
}

/**
 * Get all messages in the active branch for a room
 *
 * Retrieves only the messages that are currently active (is_active_branch = 1)
 * and not deleted, ordered by sequence number. This represents the current
 * conversation path the user is on.
 *
 * @param roomId - The chat room ID to get active messages for
 * @returns Promise resolving to array of active messages in chronological order
 * @example
 * ```typescript
 * const activeMessages = await getActiveBranchMessages(123);
 * console.log(`Active branch has ${activeMessages.length} messages`);
 * ```
 */
export async function getActiveBranchMessages(roomId: number) {
  const db = drizzle;

  const activeMsgs = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.is_active_branch, 1),
        eq(messages.is_deleted, 0)
      )
    )
    .orderBy(messages.sequence_number);

  return activeMsgs;
}

/**
 * Get all branches for a room
 *
 * Analyzes all messages in a room and groups them by branch name,
 * returning metadata about each branch including message count,
 * last message ID, creation date, and whether it's currently active.
 *
 * @param roomId - The chat room ID to get branches for
 * @returns Promise resolving to array of branch information objects
 * @example
 * ```typescript
 * const branches = await getRoomBranches(123);
 * branches.forEach(branch => {
 *   console.log(`${branch.branch_name}: ${branch.message_count} messages`);
 * });
 * ```
 */
export async function getRoomBranches(roomId: number): Promise<Branch[]> {
  const db = drizzle;

  const allMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.is_deleted, 0)
      )
    );

  // Group messages by branch
  const branchMap = new Map<string, typeof messages.$inferSelect[]>();

  for (const msg of allMessages) {
    const branchName = msg.branch_name || "main";
    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, []);
    }
    branchMap.get(branchName)!.push(msg);
  }

  // Convert to Branch objects
  const branches: Branch[] = [];

  for (const [branchName, msgs] of branchMap.entries()) {
    const sortedMsgs = msgs.sort((a, b) => a.sequence_number - b.sequence_number);
    const lastMsg = sortedMsgs[sortedMsgs.length - 1];

    branches.push({
      branch_name: branchName,
      message_count: msgs.length,
      last_message_id: lastMsg.message_id,
      created_at: sortedMsgs[0].created_at,
      is_active: msgs.some((m) => m.is_active_branch === 1),
    });
  }

  // Sort by creation date
  branches.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  return branches;
}

/**
 * Create a new branch from a specific message
 *
 * This allows users to "rollback" to a previous message and
 * create an alternative conversation path. The function:
 * 1. Generates a unique branch name if not provided (e.g., "branch-1", "branch-2")
 * 2. Deactivates all currently active messages
 * 3. Activates the path from root to the parent message
 * 4. Sets the branch name for all activated messages
 *
 * This enables exploring different conversation directions without losing history.
 *
 * @param roomId - The chat room ID to create branch in
 * @param parentMessageId - The message ID to branch from (will be included in new branch)
 * @param branchName - Optional custom branch name (auto-generated if not provided)
 * @returns Promise resolving to the new branch name
 * @throws Error if parent message is not found
 * @example
 * ```typescript
 * const branchName = await createBranchFromMessage(123, 456, "alternative-ending");
 * console.log(`Created branch: ${branchName}`);
 * // Or let it auto-generate:
 * const autoBranch = await createBranchFromMessage(123, 456);
 * // Returns "branch-1" or next available number
 * ```
 */
export async function createBranchFromMessage(
  roomId: number,
  parentMessageId: number,
  branchName?: string
): Promise<string> {
  const db = drizzle;

  // Get all existing branches to generate a unique name
  const branches = await getRoomBranches(roomId);
  const existingNames = branches.map((b) => b.branch_name);

  // Generate branch name if not provided
  let finalBranchName = branchName;
  if (!finalBranchName) {
    let counter = 1;
    while (existingNames.includes(`branch-${counter}`)) {
      counter++;
    }
    finalBranchName = `branch-${counter}`;
  }

  // Deactivate all messages in the current active branch
  await db
    .update(messages)
    .set({ is_active_branch: 0 })
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.is_active_branch, 1)
      )
    );

  // Activate messages up to and including the parent message
  // First, get the parent message to find its branch path
  const [parentMsg] = await db
    .select()
    .from(messages)
    .where(eq(messages.message_id, parentMessageId))
    .limit(1);

  if (!parentMsg) {
    throw new Error("Parent message not found");
  }

  // Build the path from root to parent
  const pathIds = await getMessagePath(parentMessageId);

  // Activate all messages in the path
  for (const msgId of pathIds) {
    await db
      .update(messages)
      .set({
        is_active_branch: 1,
        branch_name: finalBranchName,
      })
      .where(eq(messages.message_id, msgId));
  }

  return finalBranchName;
}

/**
 * Get the path from root to a specific message
 *
 * Traverses the message tree backwards from the target message to the root,
 * following parent_message_id links. Used to activate a branch by ensuring
 * all ancestor messages are included.
 *
 * @param messageId - The target message ID to trace back from
 * @returns Promise resolving to array of message IDs from root to target (inclusive)
 * @example
 * ```typescript
 * const path = await getMessagePath(789);
 * // Returns [1, 45, 234, 789] representing the full path from root
 * ```
 */
async function getMessagePath(messageId: number): Promise<number[]> {
  const db = drizzle;
  const path: number[] = [];
  let currentId: number | null = messageId;

  while (currentId !== null) {
    path.unshift(currentId);

    const [msg] = await db
      .select()
      .from(messages)
      .where(eq(messages.message_id, currentId))
      .limit(1);

    if (!msg) break;

    currentId = msg.parent_message_id;
  }

  return path;
}

/**
 * Switch to a different branch
 *
 * Changes the active branch for a room by:
 * 1. Deactivating all messages in the room
 * 2. Activating all messages with the target branch name
 * 3. Special handling for "main" branch (includes messages with null branch_name)
 *
 * After switching, only messages in the target branch will be visible
 * in the active conversation.
 *
 * @param roomId - The chat room ID to switch branches in
 * @param branchName - The branch name to switch to (e.g., "main", "branch-1")
 * @returns Promise that resolves when branch switch is complete
 * @example
 * ```typescript
 * await switchBranch(123, "branch-2");
 * // Now only branch-2 messages are active
 *
 * await switchBranch(123, "main");
 * // Switches back to main conversation path
 * ```
 */
export async function switchBranch(
  roomId: number,
  branchName: string
): Promise<void> {
  const db = drizzle;

  // Deactivate all messages
  await db
    .update(messages)
    .set({ is_active_branch: 0 })
    .where(eq(messages.room_id, roomId));

  // Activate messages in the target branch
  await db
    .update(messages)
    .set({ is_active_branch: 1 })
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.branch_name, branchName)
      )
    );

  // Also activate messages without a branch name if switching to "main"
  if (branchName === "main") {
    await db
      .update(messages)
      .set({ is_active_branch: 1 })
      .where(
        and(
          eq(messages.room_id, roomId),
          isNull(messages.branch_name)
        )
      );
  }
}

/**
 * Build a tree structure of all messages in a room
 *
 * Constructs a tree representation of all messages, preserving parent-child
 * relationships. Each node contains the message data plus a children array.
 * This is useful for visualizing the conversation tree and understanding
 * how branches diverge.
 *
 * @param roomId - The chat room ID to build tree for
 * @returns Promise resolving to array of root message nodes (messages without parents)
 * @example
 * ```typescript
 * const tree = await getMessageTree(123);
 * function printTree(nodes, indent = 0) {
 *   nodes.forEach(node => {
 *     console.log(`${'  '.repeat(indent)}${node.role}: ${node.content.substring(0, 50)}`);
 *     printTree(node.children, indent + 1);
 *   });
 * }
 * printTree(tree);
 * ```
 */
export async function getMessageTree(roomId: number): Promise<MessageNode[]> {
  const db = drizzle;

  const allMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.is_deleted, 0)
      )
    )
    .orderBy(messages.sequence_number);

  // Build a map of messages by ID
  const messageMap = new Map<number, MessageNode>();

  for (const msg of allMessages) {
    messageMap.set(msg.message_id, {
      message_id: msg.message_id,
      role: msg.role,
      content: msg.content,
      parent_message_id: msg.parent_message_id,
      branch_name: msg.branch_name,
      is_active_branch: msg.is_active_branch === 1,
      created_at: msg.created_at,
      children: [],
    });
  }

  // Build the tree structure
  const roots: MessageNode[] = [];

  for (const node of messageMap.values()) {
    if (node.parent_message_id === null) {
      roots.push(node);
    } else {
      const parent = messageMap.get(node.parent_message_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return roots;
}

/**
 * Get siblings of a message (messages with the same parent)
 *
 * Finds all messages that share the same parent_message_id as the target
 * message. This is useful for finding alternative responses at the same
 * point in the conversation tree (i.e., different branches from the same parent).
 *
 * @param messageId - The message ID to find siblings for
 * @returns Promise resolving to array of sibling message nodes (including the original message)
 * @example
 * ```typescript
 * const siblings = await getMessageSiblings(456);
 * console.log(`Message 456 has ${siblings.length - 1} siblings`);
 * siblings.forEach(sib => {
 *   console.log(`- [${sib.branch_name}] ${sib.content.substring(0, 30)}...`);
 * });
 * ```
 */
export async function getMessageSiblings(
  messageId: number
): Promise<MessageNode[]> {
  const db = drizzle;

  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.message_id, messageId))
    .limit(1);

  if (!msg) return [];

  const siblings = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, msg.room_id),
        msg.parent_message_id
          ? eq(messages.parent_message_id, msg.parent_message_id)
          : isNull(messages.parent_message_id),
        eq(messages.is_deleted, 0)
      )
    );

  return siblings.map((s) => ({
    message_id: s.message_id,
    role: s.role,
    content: s.content,
    parent_message_id: s.parent_message_id,
    branch_name: s.branch_name,
    is_active_branch: s.is_active_branch === 1,
    created_at: s.created_at,
    children: [],
  }));
}

/**
 * Delete a branch
 *
 * Performs a soft delete on all messages in the specified branch by setting
 * is_deleted = 1. This preserves the data for potential recovery while
 * hiding it from normal queries.
 *
 * Note: This does not prevent deleting the currently active branch.
 * Consider checking branch status before calling this function.
 *
 * @param roomId - The chat room ID to delete branch from
 * @param branchName - The branch name to delete
 * @returns Promise that resolves when deletion is complete
 * @example
 * ```typescript
 * await deleteBranch(123, "branch-2");
 * // All messages in branch-2 are now soft-deleted
 * ```
 */
export async function deleteBranch(
  roomId: number,
  branchName: string
): Promise<void> {
  const db = drizzle;

  // Soft delete all messages in the branch
  await db
    .update(messages)
    .set({ is_deleted: 1 })
    .where(
      and(
        eq(messages.room_id, roomId),
        eq(messages.branch_name, branchName)
      )
    );
}
