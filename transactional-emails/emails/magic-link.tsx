import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function MagicLink() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Supaplate Magic Link</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Supaplate Magic Link
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                If you requested a magic link, click the button below to login:
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`}
              >
                Click here to login
              </Button>
            </Section>
            <Section>
              <Text className="mt-10 mb-4 text-[15px] leading-relaxed text-black">
                Or, if you requested a one-time password, copy the code below
                and paste it into the website.
              </Text>
              <div className="flex justify-center">
                <code className="mx-auto inline-block rounded bg-[#dfe1e4] px-1 py-2 text-center font-mono text-[21px] font-bold tracking-[-0.3px] text-black uppercase">
                  {`{{ .Token }}`}
                </code>
              </div>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                If you did not request this code, you can safely ignore this
                email.
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
