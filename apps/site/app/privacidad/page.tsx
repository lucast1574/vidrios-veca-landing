import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteChrome";
export const metadata: Metadata = {
  title: "Política de privacidad de Vidrios VECA",
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
          Política de privacidad de Vidrios VECA
        </h1>
        <p>Actualizado el 18 de octubre de 2026.</p>
        <p>
          Esta política describe cómo se utilizan los datos personales en la web
          veca.com.pe y en el panel de trabajo panel.veca.com.pe. Vidrios VECA,
          con sede principal en San Luis y atención en Lima, es el equipo que
          recibe las consultas y gestiona las cuentas de esta plataforma. Puedes
          consultar esta página sin registrarte ni iniciar sesión.
        </p>
        <h2>Información que proporcionas</h2>
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
        <h2>Datos obtenidos mediante el acceso con Google</h2>
        <p>
          Al elegir «Continuar con Google», autorizas la autenticación básica de
          tu cuenta. Google proporciona un identificador de usuario, tu nombre,
          dirección de correo electrónico y la confirmación de que ese correo
          está verificado. El servicio de autenticación también puede recibir la
          URL de tu foto de perfil. La aplicación guarda el identificador,
          nombre y correo necesarios para reconocer tu cuenta; no publica tu
          identidad en la web por iniciar sesión. Si utilizas tu foto de Google,
          guardamos su URL para mostrarla en el panel. Puedes sustituirla por
          una foto propia o quitarla desde tu perfil. Las fotos propias se
          guardan en el almacenamiento de Nexode; su consulta requiere una
          sesión y se limita a tu cuenta o a administradores del equipo.
        </p>
        <p>
          Estos datos se utilizan para comprobar quién entra, vincular los
          próximos accesos a la misma cuenta y aplicar los permisos del equipo.
          No se solicita acceso a mensajes de Gmail, archivos de Google Drive,
          calendarios ni listas de contactos. No utilizamos los datos de Google
          para publicidad personalizada, para vender perfiles de usuarios ni
          para entrenar modelos de inteligencia artificial.
        </p>
        <h2>Para qué se utiliza la información</h2>
        <p>
          Los datos de una consulta permiten preparar una respuesta, coordinar
          una visita y registrar el avance de una oportunidad u obra. Los datos
          de una cuenta permiten identificar a los integrantes del equipo,
          tramitar solicitudes de acceso y enviar códigos de verificación o
          recuperación. El panel registra quién realiza cambios en accesos y
          movimientos de trabajo para mantener trazabilidad de la operación. Una
          consulta no autoriza por sí sola a publicar tus datos o fotografías.
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
        <h2>Uso compartido y proveedores</h2>
        <p>
          El equipo autorizado de VECA puede consultar la información necesaria
          según su función. Google procesa la autenticación; Resend recibe la
          dirección y el contenido de los mensajes que debe entregar; Nexode
          aloja la aplicación y su almacenamiento. Estos proveedores pueden
          procesar información fuera del Perú según la ubicación de su
          infraestructura. No vendemos los datos de contacto ni facilitamos
          datos de acceso a anunciantes. La publicación de proyectos utiliza
          únicamente el contenido que el equipo decide publicar expresamente.
        </p>
        <h2>Protección de la información</h2>
        <p>
          La comunicación con la web y la API utiliza HTTPS. Las contraseñas de
          las cuentas creadas por correo se almacenan como hashes, no como texto
          legible. El acceso al panel requiere autenticación y los permisos se
          comprueban en el servidor. Los códigos de verificación caducan y no
          sustituyen la aprobación de un administrador cuando esta es necesaria.
          Ningún sistema elimina por completo el riesgo de acceso no autorizado;
          evita compartir tu contraseña o los códigos que recibas por correo.
        </p>
        <h2>Conservación y eliminación</h2>
        <p>
          Las cuentas y los registros de consultas se conservan mientras sean
          necesarios para atender la relación comercial, gestionar trabajos y
          mantener la trazabilidad de la operación. La duración depende del
          estado de la cuenta o del proyecto. Puedes solicitar la eliminación o
          corrección mediante el contacto indicado abajo. El equipo verificará
          la relación con la cuenta y revisará qué datos puede eliminar y cuáles
          necesita conservar por obligaciones aplicables o por trabajos aún
          abiertos. No existe todavía una opción de borrado automático desde el
          panel. Las copias de respaldo pueden conservarse durante su ciclo de
          sustitución y no se utilizan para nuevos fines comerciales.
        </p>
        <h2>Sesión y comunicaciones</h2>
        <p>
          El panel utiliza una cookie necesaria para mantener tu sesión, con una
          vigencia de hasta doce horas. Puedes cerrarla desde el panel. Los
          correos de la plataforma incluyen códigos de acceso y avisos
          relacionados con tu cuenta, una consulta o un proyecto.
        </p>
        <h2>Tus opciones y consultas sobre tus datos</h2>
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
          También puedes retirar la conexión con VECA desde la configuración de
          conexiones con terceros de tu cuenta de Google. Esto impide futuros
          accesos mediante esa autorización, pero no elimina automáticamente los
          registros que ya facilitaste a VECA. Para solicitar esa eliminación,
          escribe al contacto anterior. Si actualizamos las funciones o el uso
          de datos, publicaremos los cambios en esta página con una nueva fecha.
        </p>
        <p>
          <a href="/">Volver a la web de Vidrios VECA</a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
