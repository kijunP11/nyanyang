import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function Welcome({ profile }: { profile: string }) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Welcome to Supaplate</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Welcome to Supaplate
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                This is an automated email sent to all users who have signed up
                to Supaplate.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                To send this email we used Supabase Queues, Supabase CRON Jobs
                and Resend.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Here's a profile of the user who signed up:
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                <code className="py-2font-mono mx-auto inline-block rounded bg-[#dfe1e4] px-1 font-bold tracking-[-0.3px] text-black">
                  {profile}
                </code>
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                We are appy to have you on board!
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Best regards,
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                The Supaplate Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

Welcome.PreviewProps = {
  profile: JSON.stringify({
    email: "test@test.com",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.png",
  }),
};
