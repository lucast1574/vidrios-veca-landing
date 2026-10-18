import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteChrome";
export const metadata: Metadata = {
  title: "Privacidad y uso de datos",
  description:
    "Información sobre los datos utilizados en las consultas y el acceso al panel de Vidrios VECA.",
  alternates: { canonical: "https://veca.com.pe/privacidad/" },
};
export default function Privacy() {
  return (
    <>
      <main
        id="contenido"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "48px 24px 80px",
          color: "#242641",
          lineHeight: 1.85,
        }}
      >
        <a href="/" aria-label="Volver a Vidrios VECA">
          <img
            src="/assets/logo-google.png"
            alt="Vidrios VECA"
            width="80"
            height="80"
          />
        </a>
        <p>Vidrios VECA · San Luis, Lima</p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.12 }}>
          Privacidad y uso de datos
        </h1>
        <p>Actualizado el 18 de octubre de 2026.</p>
        <h2>Consultas sobre proyectos</h2>
        <p>
          El formulario solicita nombre, correo electrónico, teléfono o
          WhatsApp, distrito, tipo de trabajo y los detalles que decidas
          compartir. El equipo de Vidrios VECA utiliza esta información para
          atender la consulta, contactar contigo y dar seguimiento al proyecto.
        </p>
        <h2>Acceso al panel</h2>
        <p>
          El registro utiliza tu nombre y correo. Al iniciar sesión con Google
          se comprueban tu identidad y tu correo; este acceso no solicita leer
          tus mensajes de Gmail, tus archivos de Drive ni tus contactos. También
          puedes utilizar correo y contraseña con verificación por código. La
          contraseña se guarda mediante un hash criptográfico.
        </p>
        <h2>Quién puede acceder</h2>
        <p>
          Las cuentas externas requieren aprobación o una invitación del
          administrador. El acceso a oportunidades, proyectos, inventario y
          usuarios depende de los permisos asignados. El contenido de proyectos
          que el equipo publica expresamente queda disponible en el sitio web.
        </p>
        <h2>Servicios utilizados</h2>
        <p>
          La plataforma utiliza servicios de Google para comprobar el acceso con
          Google, Resend para enviar códigos y mensajes transaccionales, y la
          infraestructura de Nexode para alojar la aplicación, los datos y los
          archivos. Estos servicios procesan la información necesaria para
          prestar su función.
        </p>
        <h2>Sesión y comunicaciones</h2>
        <p>
          El panel utiliza una cookie necesaria para mantener tu sesión, con una
          vigencia de hasta doce horas. Puedes cerrarla desde el panel. Los
          correos de la plataforma incluyen códigos de acceso y avisos
          relacionados con tu cuenta, una consulta o un proyecto.
        </p>
        <h2>Consultas sobre tus datos</h2>
        <p>
          Para solicitar información, corrección o eliminación de datos que
          hayas proporcionado, comunícate con Vidrios VECA a través de{" "}
          <a href="mailto:ventas@veca.com.pe">ventas@veca.com.pe</a> o del{" "}
          <a href="https://wa.me/51908917621">
            WhatsApp Business +51 908 917 621
          </a>
          . Indica la cuenta o consulta a la que se refiere tu solicitud para
          que el equipo pueda identificarla y atenderte.
        </p>
        <p>
          <a href="/">Volver a la web de Vidrios VECA</a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
