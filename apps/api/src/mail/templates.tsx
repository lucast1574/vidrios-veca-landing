import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { config } from "../common/config";
export type MailContent = {
  title: string;
  preview: string;
  name?: string;
  paragraphs: string[];
  code?: string;
  action?: { label: string; url: string };
};
export function VecaMail({
  title,
  preview,
  name,
  paragraphs,
  code,
  action,
}: MailContent) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#edf1ef",
          fontFamily: "Arial, sans-serif",
          margin: "0",
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            maxWidth: "580px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <Section style={{ backgroundColor: "#242641", padding: "28px 32px" }}>
            <Img
              src="https://veca.com.pe/assets/logo-email.png"
              width="88"
              height="57"
              alt="Vidrios VECA"
            />
          </Section>
          <Section style={{ padding: "30px 32px" }}>
            <Heading
              style={{
                color: "#242641",
                fontSize: "27px",
                lineHeight: "1.25",
                fontWeight: 600,
                margin: "0 0 24px",
              }}
            >
              {title}
            </Heading>
            {name && (
              <Text style={{ color: "#515a61", fontSize: "15px" }}>
                Hola, {name}.
              </Text>
            )}
            {paragraphs.map((text, i) => (
              <Text
                key={i}
                style={{
                  color: "#515a61",
                  fontSize: "15px",
                  lineHeight: "1.8",
                }}
              >
                {text}
              </Text>
            ))}
            {code && (
              <Section
                style={{
                  backgroundColor: "#f0f3f1",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: "32px",
                    letterSpacing: "8px",
                    fontWeight: 700,
                    color: "#242641",
                    margin: 0,
                  }}
                >
                  {code}
                </Text>
              </Section>
            )}
            {action && (
              <Button
                href={action.url}
                style={{
                  backgroundColor: "#ef4b29",
                  color: "#fff",
                  borderRadius: "7px",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "15px 24px",
                  marginTop: "18px",
                }}
              >
                {action.label}
              </Button>
            )}
            <Hr style={{ borderColor: "#e6e9e7", marginTop: "30px" }} />
            <Text
              style={{ fontSize: "12px", lineHeight: "1.7", color: "#7d858b" }}
            >
              Vidrios VECA · San Luis, Lima
              <br />
              Atención en toda Lima · veca.com.pe
              <br />
              Este mensaje está relacionado con tu cuenta o una consulta que
              realizaste.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
export async function emailMarkup(content: MailContent) {
  return render(<VecaMail {...content} />);
}
export const panelAction = (label: string, path = "") => ({
  label,
  url: config.PANEL_ORIGIN + "/" + path,
});
