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

export default function ConfirmEmail() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Confirm Email Address</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Confirm Email Address
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Click the button below to confirm your email address:
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`}
              >
                Confirm Email Address
              </Button>
            </Section>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                If the button above does not work, you can copy and paste the
                URL below into your browser:
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-blue-500">
                {`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                If you did not create an account with Supaplate, you can safely
                ignore this email.
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
