import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.column}>
          <img src="/wg_logo.png" alt="WG" className={styles.brand} />
          <p className={styles.desc}>
            Ropa Deportiva de Alto Rendimiento. Muevete con estilo.
          </p>
          <form className={styles.newsletter} onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className={styles.button}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Enviando..." : "Suscribirse"}
            </button>
          </form>
          {status === "success" && (
            <p className={styles.newsletterMsg}>
              ¡Gracias por suscribirte! Recibirás nuestras promociones.
            </p>
          )}
          {status === "error" && (
            <p className={`${styles.newsletterMsg} ${styles.newsletterError}`}>
              Hubo un error al suscribirte. Inténtalo de nuevo.
            </p>
          )}
        </div>
        <div className={styles.column}>
          <h4 className={styles.title}>Enlaces Rápidos</h4>
          <Link to="/" className={styles.link}>
            Inicio
          </Link>
          <Link to="/catalogo" className={styles.link}>
            Catálogo
          </Link>
        </div>
        <div className={styles.column}>
          <h4 className={styles.title}>Soporte</h4>
          <div className={styles.supportItem}>
            <span className={styles.iconWrapper}>✉</span>
            <span>wgsportspal@gmail.com</span>
          </div>
        </div>
        <div className={styles.column}>
          <h4 className={styles.title}>Redes Sociales</h4>
          <a
            href="https://www.instagram.com/_wg_sport/"
            className={styles.link}
          >
            Instagram
          </a>
          <a href="#" className={styles.link}>
            Facebook
          </a>
        </div>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} WG. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
