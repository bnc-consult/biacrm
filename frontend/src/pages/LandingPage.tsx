export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        :root{--bg:#0f172a;--muted:#94a3b8;--card:#fff;--accent:#06b6d4}
        *{box-sizing:border-box}
        body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial;margin:0;background:linear-gradient(180deg,#071026 0%, #07172a 60%);color:#e6eef8}
        .hero{padding:68px 20px 56px;text-align:center}
        .container{max-width:1100px;margin:0 auto;padding:0 20px}
        h1{font-size:34px;margin:8px 0 6px;letter-spacing:0.2px}
        p.lead{font-size:18px;color:var(--muted);max-width:900px;margin:0 auto}
        .cta{display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:12px 18px;background:var(--accent);color:#072030;border-radius:10px;text-decoration:none;font-weight:600}
        header .logo{height:72px;display:inline-block;margin-bottom:14px}

        .brain-wrap{width:120px;height:120px;margin:18px auto 8px;position:relative}
        .node{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,#34d399,#06b6d4);position:absolute;box-shadow:0 6px 20px rgba(6,182,212,0.12)}
        svg.network{width:100%;height:100%;position:absolute;left:0;top:0}
        .pulse{animation:pulse 2.4s infinite ease-in-out}
        @keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:0.8}100%{transform:scale(1);opacity:1}}

        main{background:rgba(255,255,255,0.02);backdrop-filter:blur(6px);margin-top:18px;padding:28px;border-top-left-radius:12px;border-top-right-radius:12px}
        .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px}
        .feature{background:rgba(255,255,255,0.03);padding:16px;border-radius:10px;border:1px solid rgba(255,255,255,0.03);color:#e6eef8}

        .plans{display:flex;gap:18px;margin-top:28px;flex-wrap:wrap}
        .card{flex:1;min-width:240px;background:#fff;color:#062020;padding:18px;border-radius:12px}
        .price{font-size:22px;font-weight:700;margin:8px 0}

        .section-title{color:#cfeef7;margin-top:8px}
        footer{padding:28px;text-align:center;color:#6b7280}

        @media (max-width:720px){h1{font-size:22px}.plans{flex-direction:column}.brain-wrap{width:84px;height:84px}}
      `}</style>

      <header className="hero">
        <div className="container">
          <div className="logo-wrap">
            <img
              className="logo"
              src="/landingpage/media/logo.jpg"
              alt="BIACRM logo"
              onError={(event) => {
                const target = event.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>

          <div className="brain-wrap" aria-hidden={true}>
            <svg className="network" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#34d399" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <line x1="18" y1="30" x2="44" y2="20" stroke="url(#g1)" strokeOpacity="0.45" strokeWidth="2" />
              <line x1="44" y1="20" x2="86" y2="28" stroke="url(#g1)" strokeOpacity="0.45" strokeWidth="2" />
              <line x1="44" y1="20" x2="44" y2="60" stroke="url(#g1)" strokeOpacity="0.45" strokeWidth="2" />
              <line x1="86" y1="28" x2="70" y2="78" stroke="url(#g1)" strokeOpacity="0.45" strokeWidth="2" />
              <line x1="44" y1="60" x2="70" y2="78" stroke="url(#g1)" strokeOpacity="0.45" strokeWidth="2" />
            </svg>
            <div className="node pulse" style={{ left: '14px', top: '26px' }}></div>
            <div className="node" style={{ left: '40px', top: '16px', animation: 'dot 3s infinite linear' }}></div>
            <div className="node pulse" style={{ left: '84px', top: '24px' }}></div>
            <div className="node" style={{ left: '40px', top: '56px' }}></div>
            <div className="node" style={{ left: '68px', top: '72px' }}></div>
          </div>

          <h1>BIACRM - CRM + Automacao via WhatsApp com IA</h1>
          <p className="lead">
            Implemente automacoes que qualificam leads, automatizam atendimento e aumentam conversoes - pronto para uso com
            WhatsApp e integrado ao seu fluxo.
          </p>
          <a className="cta" href="#plans">Conheca os planos</a>
        </div>
      </header>

      <main className="container">
        <section>
          <h2 className="section-title">Por que BIACRM?</h2>
          <div className="features">
            <div className="feature">
              <strong>Integracao nativa com WhatsApp</strong>
              <div style={{ marginTop: '6px', color: 'var(--muted)' }}>Converse, qualifique e agende diretamente do mesmo painel.</div>
            </div>
            <div className="feature">
              <strong>IA para qualificacao de leads</strong>
              <div style={{ marginTop: '6px', color: 'var(--muted)' }}>Resumo automatico e score para priorizar quem converte.</div>
            </div>
            <div className="feature">
              <strong>Automacao de fluxos</strong>
              <div style={{ marginTop: '6px', color: 'var(--muted)' }}>Follow-ups, agendamento e geracao de propostas automatizadas.</div>
            </div>
            <div className="feature">
              <strong>Relatorios e BI</strong>
              <div style={{ marginTop: '6px', color: 'var(--muted)' }}>Dashboards e previsoes para decisoes rapidas.</div>
            </div>
          </div>
        </section>

        <section id="plans">
          <h2 className="section-title">Planos</h2>
          <div className="plans">
            <div className="card">
              <h3>Starter</h3>
              <div className="price">R$199 / mes</div>
              <div style={{ color: '#334155' }}>1 numero WhatsApp - 2 usuarios - 2 automacoes simples - 2k msgs</div>
              <a className="cta" href="https://buy.stripe.com/14A7sK225ezPeOF9y46kg00">Contratar</a>
            </div>
            <div className="card">
              <h3>Pro</h3>
              <div className="price">R$599 / mes</div>
              <div style={{ color: '#334155' }}>1-2 numeros - 5 usuarios - Automacao + IA - 10k msgs</div>
              <a className="cta" href="https://buy.stripe.com/aFa00i225ezPgWNcKg6kg01">Contratar</a>
            </div>
            <div className="card">
              <h3>Scale</h3>
              <div className="price">R$1.499 / mes</div>
              <div style={{ color: '#334155' }}>Numeros multiplos - 15 usuarios - Dashboards - SLA</div>
              <a className="cta" href="https://buy.stripe.com/fZu14mgWZ0IZ21TdOk6kg02">Contratar</a>
            </div>
          </div>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 className="section-title">Como funciona o pilot pago</h2>
          <p style={{ color: 'var(--muted)' }}>
            Oferecemos pilot pago: 50% do setup + 20% off no primeiro mes. Implementacao em ate 14 dias com entregaveis mensuraveis.
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 className="section-title">Contato</h2>
          <p style={{ color: 'var(--muted)' }}>
            Email: <a style={{ color: '#9be7ef' }} href="mailto:contato@bncconsultoria.com">contato@bncconsultoria.com</a> - PIX: 53.905.812/0001-42
          </p>
        </section>
      </main>

      <footer>
        (c) BNC Consultoria em TI LTDA - BIACRM
      </footer>
    </>
  );
}
