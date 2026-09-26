import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { initLanding } from './landing/engine';
import './landing/landing.css';

const BOLT = 'M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z';

function Bolt({ className = '', draw = false }) {
    return (
        <svg className={`${className} ${draw ? 'bolt-draw' : ''}`} viewBox="195 -4 336 570" aria-hidden="true">
            <path d={BOLT} fill="#5C7969" stroke="#5C7969" strokeWidth="6" strokeLinejoin="round" />
        </svg>
    );
}

const Arrow = () => (
    <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Deadline pill, same as the patient portal: sage pill, white bolt, day label.
function Pill({ d }) {
    const bolt = /^[JH]/.test(d);
    return (
        <span className={`jpill ${bolt ? '' : 'jpill-plain'}`}>
            {bolt && (
                <svg viewBox="195 -4 336 570" aria-hidden="true"><path d={BOLT} fill="#fff" /></svg>
            )}
            {d}
        </span>
    );
}

// Wraps every deadline mention (J-18, J-7, J0, J+1, e-Satis...) of a string in a pill.
const DEADLINE = /(J[-+]\d+|H[-+]\d+|J0|e-Satis)/g;
function withPills(text) {
    return text.split(DEADLINE).map((part, i) => (i % 2 ? <Pill key={i} d={part} /> : part));
}

const LEDE_1 = 'Jeûne, arrêt des traitements, consignes J-7 à H-2 : un guidage patient intelligent par SMS qui valide chaque prérequis sans surcharger vos secrétariats.';

// Script 1 subtitle: deadline pills plus the Messages icon right after "par SMS".
function withSmsIcon(text) {
    const [before, after] = text.split('par SMS');
    if (after === undefined) return withPills(text);
    return (
        <>
            {withPills(before)}<span className="nowrap">par SMS<img className="inline-sms" src="/landing/icon-sms.png" alt="" aria-hidden="true" /></span>{withPills(after)}
        </>
    );
}

const COST_PER = 2840;
const fmt = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ');

const STEPS = [
    { d: 'Inscription', q: 'Fiche médicale signée en ligne', a: 'Relance SMS, puis appel de la clinique' },
    { d: 'J-18', q: 'Bilan sanguin et examens faits ?', a: 'Alerte équipe, nouvelle prescription' },
    { d: 'J-7', q: 'Consultation d’anesthésie faite ?', a: 'La clinique cale le rendez-vous' },
    { d: 'J-1', q: 'Jeûne, douche, consignes compris ?', a: 'Appel la veille, report décidé avant J0' },
    { d: 'J0', q: 'Le bloc', a: 'Le patient arrive prêt', zero: true },
    { d: 'J+1', q: 'Comment vous sentez-vous ?', a: 'Rappel infirmier prioritaire le matin', after: true },
    { d: 'J+4', q: 'Satisfaction de la prise en charge', a: 'Rappel si la note est basse', after: true },
    { d: 'e-Satis', q: 'Enquête nationale HAS', a: 'Envoyée par la plateforme nationale', after: true },
];

function Demo() {
    const [phase, setPhase] = useState(0); // 0 idle, 1 answered no, 2 answered yes
    const [stage, setStage] = useState(0);
    const timers = useRef([]);
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    useEffect(() => clear, []);

    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const answer = (no) => {
        clear();
        setPhase(no ? 1 : 2);
        if (reduced()) { setStage(4); return; }
        setStage(1);
        [900, 1900, 2900].forEach((t, i) => timers.current.push(setTimeout(() => setStage(i + 2), t)));
    };
    const reset = () => { clear(); setPhase(0); setStage(0); };

    const no = phase === 1;
    const flowNo = [
        { t: 'Réponse « non » enregistrée', s: 'Horodatée à la minute, visible dans la fiche patient.', cls: 'alert' },
        { t: 'Alerte au tableau de bord', s: 'Le compteur « Actions requises » passe à 1, l’alarme sonne.', cls: 'alert', pill: true },
        { t: 'La clinique rappelle le patient', s: 'Le rendez-vous d’anesthésie est fixé dans la journée.', cls: '' },
        { t: 'Opération maintenue', s: 'Le créneau est sauvé, six jours avant le bloc.', cls: 'ok' },
    ];
    const flowYes = [
        { t: 'Réponse « oui » enregistrée', s: 'Horodatée à la minute, visible dans la fiche patient.', cls: 'ok' },
        { t: 'Étape conforme', s: 'Le taux de conformité du tableau de bord monte.', cls: 'ok' },
        { t: 'Rien à faire pour l’équipe', s: 'Le secrétariat garde son temps pour les vrais cas.', cls: 'ok' },
        { t: 'Prochaine étape : J-1', s: 'Consignes de jeûne et de douche envoyées la veille.', cls: 'ok' },
    ];
    const flow = phase === 0 ? flowNo : (no ? flowNo : flowYes);

    return (
        <div className="demo">
            <div className="phone rv" aria-label="Simulation d'un SMS SurgiLink à J-7">
                <div className="phone-screen">
                    <div className="phone-notch" />
                    <div className="phone-head">
                        <div className="av"><Bolt /></div>
                        <b>Medical Alliance</b>
                        <small>via SurgiLink</small>
                    </div>
                    <div className="thread" aria-live="polite">
                        <div className="bub in-msg show">
                            Bonjour Camille, votre intervention a lieu dans 7 jours. Avez-vous réalisé votre consultation d&rsquo;anesthésie ?
                            <span className="time"><Pill d="J-7" /> 09:30</span>
                        </div>
                        <div className={`bub out-msg ${no ? 'no' : ''} ${phase ? 'show' : ''}`}>
                            {no ? 'Non, pas encore' : 'Oui, c’est fait'}
                            <span className="time">09:42</span>
                        </div>
                        <div className={`bub in-msg ${stage >= 4 ? 'show' : ''}`}>
                            {no ? 'Merci. La clinique vous appelle aujourd’hui pour fixer le rendez-vous.' : 'Parfait, merci. Prochain message la veille de votre intervention.'}
                            <span className="time">09:42</span>
                        </div>
                    </div>
                    <div className="answers" aria-disabled={phase !== 0}>
                        <button type="button" className="btn glass btn-no" onClick={() => answer(true)}>Non</button>
                        <button type="button" className="btn glass" onClick={() => answer(false)}>Oui</button>
                    </div>
                </div>
            </div>
            <div>
                <p className="kicker rv">Essayez</p>
                <h2 className="h-sec rv">Répondez à la place <em>de la patiente.</em></h2>
                <p className="lede rv">{withPills('Un « non » à J-7 suffit à déclencher tout le filet de sécurité. Touchez une réponse sur le téléphone.')}')}</p>
                <ol className="flow">
                    {flow.map((f, i) => (
                        <li key={f.t} className={`glass ${stage > i ? 'on' : ''} ${f.cls}`}>
                            <span className="n">{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <b>{withPills(f.t)}</b>
                                <span>{f.s}</span>
                                {f.pill && stage > i && no && <div className="counter-pill"><i />Actions requises : 1</div>}
                            </div>
                        </li>
                    ))}
                </ol>
                {phase !== 0 && stage >= 4 && (
                    <button type="button" className="btn glass btn-sm demo-reset" onClick={reset}>Rejouer</button>
                )}
                {phase === 0 && <p className="demo-hint">Choisissez « Non » pour voir l&rsquo;alerte</p>}
            </div>
        </div>
    );
}

function Calculator() {
    const [n, setN] = useState(3);
    const annual = n * COST_PER * 12;
    return (
        <div className="calc glass rv">
            <div className="label">Coût annuel des annulations évitables</div>
            <div className="annual" aria-live="polite">{fmt(annual)} <small>€</small></div>
            <div className="sub">soit {fmt(n * COST_PER)} € perdus chaque mois</div>
            <div className="slider">
                <div className="slider-top">
                    <label htmlFor="sl-n" className="label">Annulations évitables par mois</label>
                    <b>{n}</b>
                </div>
                <input id="sl-n" type="range" min="1" max="12" step="1" value={n}
                    style={{ '--fill': `${((n - 1) / 11) * 100}%` }}
                    onChange={(e) => setN(Number(e.target.value))} />
            </div>
            <div className="note-key">{withPills('Une non-conformité détectée à J-7 laisse le temps de réattribuer le créneau. Détectée le matin même, il est perdu.')}</div>
            <p className="fine">Valeurs par défaut prudentes. Séjour clinique : coût moyen ATIH d&rsquo;environ 1 910 €, honoraires exclus. Honoraires indicatifs : 600 € chirurgien, 300 € anesthésiste. Reprogrammation : 2 heures d&rsquo;équipe à 20 € chargés. Trois annulations par mois : hypothèse de travail à confronter à vos relevés.</p>
        </div>
    );
}

function ContactForm() {
    const [sent, setSent] = useState(false);
    const onSubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = [
            `Nom : ${f.get('nom')}`,
            `Établissement : ${f.get('etab')}`,
            `Fonction : ${f.get('role')}`,
            `Téléphone : ${f.get('tel')}`,
            `E-mail : ${f.get('email')}`,
            '',
            f.get('msg') || '',
        ].join('\n');
        window.location.href = `mailto:contact@robinmasini.com?subject=${encodeURIComponent('Demande de démo SurgiLink')}&body=${encodeURIComponent(body)}`;
        setSent(true);
    };
    if (sent) {
        return (
            <div className="form glass form-ok" role="status">
                <Bolt className="" />
                <h4>Votre messagerie s&rsquo;ouvre.</h4>
                <p>Envoyez le message préparé : nous revenons vers vous sous 48 heures ouvrées.</p>
                <button type="button" className="btn glass btn-sm" style={{ marginTop: 20 }} onClick={() => setSent(false)}>Modifier ma demande</button>
            </div>
        );
    }
    return (
        <form className="form glass" onSubmit={onSubmit}>
            <div className="two">
                <div className="field"><label htmlFor="f-nom">Nom</label><input id="f-nom" name="nom" required autoComplete="name" placeholder="Dr Marie Laurent" /></div>
                <div className="field"><label htmlFor="f-role">Fonction</label>
                    <select id="f-role" name="role" defaultValue="Chirurgien">
                        <option>Chirurgien</option><option>Direction de clinique</option><option>Cadre de bloc</option><option>Secrétariat médical</option><option>Autre</option>
                    </select>
                </div>
            </div>
            <div className="field"><label htmlFor="f-etab">Clinique ou cabinet</label><input id="f-etab" name="etab" required placeholder="Clinique, ville" /></div>
            <div className="two">
                <div className="field"><label htmlFor="f-email">E-mail</label><input id="f-email" name="email" type="email" required autoComplete="email" placeholder="vous@clinique.fr" /></div>
                <div className="field"><label htmlFor="f-tel">Téléphone</label><input id="f-tel" name="tel" type="tel" autoComplete="tel" placeholder="06 00 00 00 00" /></div>
            </div>
            <div className="field"><label htmlFor="f-msg">Votre contexte (facultatif)</label><textarea id="f-msg" name="msg" placeholder="Nombre d'interventions par semaine, annulations constatées..." /></div>
            <button type="submit" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Demander ma démo</span><Arrow /></button>
            <p className="fine">Le bouton ouvre votre messagerie avec la demande prête à envoyer à contact@robinmasini.com. Aucune donnée n&rsquo;est stockée par ce site.</p>
        </form>
    );
}

// The installed app (home screen PWA) always opened on "/" -> login: keep that.
const isInstalledApp = () => typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

export default function Landing() {
    if (isInstalledApp()) return <Navigate to="/login" replace />;
    return <LandingPage />;
}

function LandingPage() {
    const root = useRef(null);

    useEffect(() => {
        document.title = 'SurgiLink · Aucune annulation évitable le jour de l’opération';
        return initLanding(root.current);
    }, []);

    return (
        <div className="sl" ref={root}>
            <a className="skip" href="#main">Aller au contenu</a>

            {/* Liquid glass refraction filter (Chromium) */}
            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                <filter id="sl-liquid" x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n" />
                    <feGaussianBlur in="n" stdDeviation="2" result="nb" />
                    <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            <div className="sl-env" aria-hidden="true" />
            <canvas className="sl-dust" aria-hidden="true" />

            <nav className="sl-nav glass" aria-label="Navigation principale">
                <a className="brand" href="#top" aria-label="SurgiLink, retour en haut">
                    <Bolt draw />
                    <span className="brand-word">SURGI<b>LINK</b></span>
                </a>
                <ul>
                    <li><a href="#cout">Le coût</a></li>
                    <li><a href="#methode">La méthode</a></li>
                    <li><a href="#parcours">Le parcours</a></li>
                    <li><a href="#demo">Démo</a></li>
                    <li><a href="#confiance">Sécurité</a></li>
                </ul>
                <div className="nav-cta">
                    <Link to="/login" className="btn glass btn-sm btn-ghost"><span className="shine" />Espace pro</Link>
                    <a href="#contact" className="btn btn-primary glass btn-sm"><span className="shine" /><span>Démo</span></a>
                </div>
            </nav>

            {/* ============ Scroll film ============ */}
            <header className="hero" id="top" data-hero>
                <div className="stage">
                    <div className="poster" aria-hidden="true" />
                    <video preload="none" muted playsInline aria-hidden="true" tabIndex={-1} />
                    <div className="veil" aria-hidden="true" />

                    <section className="band band-tl band-card" data-band="0,0.14">
                        <div className="cost-card title-card glass">
                            <p className="kicker">Sécurisation du parcours chirurgical</p>
                            <h1 className="h-hero fx-blur">
                                <span className="sr-only">Anticipez les annulations de bloc avant qu&rsquo;il ne soit trop tard.</span>
                                <span className="soft" aria-hidden="true">Anticipez les <em>annulations de bloc</em> avant qu&rsquo;il ne soit trop tard.</span>
                                <span className="sharp" aria-hidden="true">Anticipez les <em>annulations de bloc</em> avant qu&rsquo;il ne soit trop tard.</span>
                            </h1>
                            <p className="lede">{withSmsIcon(LEDE_1)}</p>
                            <div className="title-cta">
                                <a href="#contact" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Je sauve des créneaux</span><Arrow /></a>
                            </div>
                        </div>
                    </section>

                    <section className="band band-phone" data-band="0,0.14">
                        <div className="phones-duo">
                            <img src="/landing/phones-duo.webp" alt="Le portail patient SurgiLink sur iPhone : explication du suivi par SMS et page d'accueil du patient" />
                        </div>
                    </section>

                    <section className="band band-tl band-card" data-band="0.17,0.35">
                        <div className="cost-card glass">
                            <p className="kicker">Le vrai coût</p>
                            <h2 className="h-hero fx-drift" data-split="words">Une annulation découverte le matin même coûte un créneau entier.</h2>
                            <div className="big-num" role="img" aria-label="2 840 euros par annulation">
                                <span className="odo" data-odo="2840" aria-hidden="true" />
                                <small aria-hidden="true">€</small>
                            </div>
                            <p className="num-note">Par annulation · bloc, honoraires, reprogrammation</p>
                            <div className="title-cta">
                                <a href="#contact" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Je sauve des créneaux</span><Arrow /></a>
                            </div>
                        </div>
                    </section>

                    <section className="band band-tl" data-band="0.38,0.50" style={{ '--va': .62 }}>
                        <p className="kicker">Le matin de l&rsquo;intervention</p>
                        <h2 className="h-hero fx-snap" data-split="chars" data-spread="0.5">Le bloc est prêt. Le patient l&rsquo;est-il&nbsp;?</h2>
                        <div className="causes fx-snap-chips" style={{ justifyContent: 'flex-start', marginLeft: 0 }}>
                            {['Tabac', 'Jeûne', 'Anticoagulants', 'Bilan sanguin', 'Anesthésie', 'Hygiène'].map((c) => (
                                <span key={c} className="chip glass">{c}</span>
                            ))}
                        </div>
                        <div className="title-cta">
                                <a href="#contact" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Je sauve des créneaux</span><Arrow /></a>
                            </div>
                    </section>

                    <section className="band band-tc" data-band="0.53,0.69" style={{ '--va': .55 }}>
                        <div className="fx-approach">
                            <p className="kicker">SurgiLink</p>
                            <h2 className="h-hero">Nous posons la question <em>avant</em> le bloc.</h2>
                            <p className="lede">{withPills('Par SMS, à J-18, J-7 et J-1.')} Chaque « non » remonte à votre équipe pendant qu&rsquo;il reste le temps de corriger.</p>
                            <div className="title-cta">
                                <a href="#contact" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Je sauve des créneaux</span><Arrow /></a>
                            </div>
                        </div>
                    </section>

                    <section className="band band-settle" data-band="0.74,1" style={{ '--va': .5 }}>
                        <h2 className="h-hero fx-rise" data-split="words">Chaque créneau de bloc, <span className="gold">protégé.</span></h2>
                        <p className="lede fx-sub">Pour les cliniques et les chirurgiens esthétiques qui ne veulent plus perdre une journée de bloc.</p>
                        <div className="settle-ctas fx-btns">
                            <a href="#contact" className="btn btn-primary glass lg-refract"><span className="shine" /><span>Demander une démo</span><Arrow /></a>
                            <Link to="/login" className="btn glass lg-refract"><span className="shine" />Accéder à mon espace</Link>
                        </div>
                    </section>

                    <section className="band band-cal band-card" data-band="0.80,1" data-ramp="0.07" aria-label="Intervention réalisée, créneau maintenu">
                        <div className="cal-card glass">
                            <div className="cal-head">
                                <span className="cal-brand"><Bolt /> SurgiLink</span>
                                <span className="cal-status">Validé</span>
                            </div>
                            <div className="cal-body">
                                <div className="cal-tile" aria-hidden="true">
                                    <span className="cal-month">Mars</span>
                                    <span className="cal-day">12</span>
                                    <svg className="cal-check" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="18" />
                                        <path d="M12 20.5l5.5 5.5L28.5 14" pathLength="1" />
                                    </svg>
                                </div>
                                <div className="cal-text">
                                    <b>Intervention réalisée</b>
                                    <span>Créneau maintenu, protocole complet</span>
                                    <Pill d="J0" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <svg className="ring" viewBox="0 0 48 48" aria-hidden="true">
                        <circle className="track" cx="24" cy="24" r="20" fill="none" strokeWidth="2" />
                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="126" style={{ strokeDashoffset: 'var(--ld,126)' }} />
                    </svg>
                    <div className="cue" aria-hidden="true">Défiler<i /></div>
                                    </div>
            </header>

            {/* Static hero for phones, tablets in portrait and reduced motion */}
            <header className="hero-static">
                <div className="hs-copy">
                    <p className="kicker">Sécurisation du parcours chirurgical</p>
                    <h1 className="h-hero">Anticipez les <em>annulations de bloc</em> avant qu&rsquo;il ne soit trop tard.</h1>
                    <p className="lede" style={{ marginInline: 'auto' }}>{withSmsIcon(LEDE_1)}</p>
                    <div className="settle-ctas">
                        <a href="#contact" className="btn btn-primary glass"><span className="shine" /><span>Je sauve des créneaux</span><Arrow /></a>
                        <Link to="/login" className="btn glass"><span className="shine" />Accéder à mon espace</Link>
                    </div>
                </div>
                <div className="hs-img" style={{ backgroundImage: 'url(/landing/hero-ending.jpg)' }} role="img" aria-label="Une patiente accompagnée par son chirurgien" />
            </header>

            <main id="main" tabIndex={-1}>
                {/* Cost */}
                <section className="sec" id="cout" data-reveal>
                    <div className="wrap">
                        <p className="kicker rv">Le problème</p>
                        <h2 className="h-sec rv">Une annulation le jour J ne se <em>récupère</em> pas.</h2>
                        <p className="lede rv">Bloc immobilisé, personnel et matériel mobilisés, honoraires perdus, temps de reprogrammation. Et presque toujours, la cause était visible quelques jours avant.</p>
                        <div className="cost-grid">
                            <ul className="cost-lines rv">
                                <li><span>Recette du séjour pour la clinique</span><b>1 900 €</b></li>
                                <li><span>Honoraires du chirurgien</span><b>600 €</b></li>
                                <li><span>Honoraires de l&rsquo;anesthésiste</span><b>300 €</b></li>
                                <li><span>Reprogrammation, 2 h d&rsquo;équipe</span><b>40 €</b></li>
                                <li className="total"><span>Par annulation</span><b>2 840 €</b></li>
                            </ul>
                            <Calculator />
                        </div>
                    </div>
                </section>

                <div className="divider" aria-hidden="true" />

                {/* Method */}
                <section className="sec center" id="methode" data-reveal>
                    <div className="wrap">
                        <p className="kicker rv">La méthode</p>
                        <h2 className="h-sec rv">Anticiper. Détecter. <em>Agir.</em></h2>
                        <p className="lede rv">SurgiLink interroge le patient par SMS à chaque étape clé et signale toute non-conformité à l&rsquo;équipe pendant qu&rsquo;il reste le temps de corriger.</p>
                        <div className="method" style={{ textAlign: 'left' }}>
                            {[
                                ['01', 'Anticiper', 'Des questionnaires courts partent tout seuls à J-18, J-7 et J-1. Le patient répond en un geste.', 'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm8-4v4l3 2'],
                                ['02', 'Détecter', 'Chaque « non » ou absence de réponse remonte au tableau de bord, avec l’alarme.', 'M12 3 2 20h20L12 3Zm0 6v5m0 3v.5'],
                                ['03', 'Agir', 'Le secrétariat rappelle le patient avant le jour J. Le créneau est sauvé ou réattribué.', 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z'],
                            ].map(([i, t, p, d]) => (
                                <article key={t} className="m-card glass rv">
                                    <span className="idx">{i}</span>
                                    <h3>{t}</h3>
                                    <p>{withPills(p)}</p>
                                    <span className="ico" aria-hidden="true">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                                    </span>
                                </article>
                            ))}
                        </div>
                        <p className="no-app rv"><b>Aucune application à installer.</b> Le patient ouvre un lien reçu par SMS. L&rsquo;équipe utilise la même plateforme sur mobile et sur ordinateur.</p>
                    </div>
                </section>

                {/* Timeline */}
                <section className="sec" id="parcours" data-reveal data-timeline>
                    <div className="wrap">
                        <div className="center">
                            <p className="kicker rv">Le parcours patient</p>
                            <h2 className="h-sec rv">Sept rendez-vous par SMS. Une action prévue <em>à chaque « non ».</em></h2>
                        </div>
                        <div className="tl">
                            <svg className="tl-line" viewBox="0 0 1000 20" preserveAspectRatio="none" aria-hidden="true">
                                <line x1="62" y1="10" x2="938" y2="10" stroke="rgba(30,38,34,.1)" strokeWidth="2" />
                                <line className="tl-draw-a" x1="62" y1="10" x2="562" y2="10" stroke="#5C7969" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
                                <line className="tl-draw-b" x1="562" y1="10" x2="938" y2="10" stroke="#C0A666" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
                            </svg>
                            <ol className="tl-steps">
                                {STEPS.map((s) => (
                                    <li key={s.d} className={`${s.after ? 'after' : ''} ${s.zero ? 'zero' : ''}`}>
                                        <span className="tl-day"><Pill d={s.d} /></span>
                                        <span className="tl-dot" aria-hidden="true" />
                                        <p className="tl-q">{s.q}</p>
                                        <p className="tl-a">{s.a}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="tl-legend"><span><i />Sécuriser l&rsquo;opération</span><span><i />Suivi et qualité après l&rsquo;opération</span></div>
                        <div className="real-sms">
                            <p className="kicker rv">Les vrais SMS reçus par les patients</p>
                            <div className="sms-row">
                                <figure className="sms-card glass rv">
                                    <img src="/landing/sms-fiche.png" alt="SMS Medical Alliance : bienvenue au cabinet du Dr Desouches, merci de remplir votre fiche médicale via le lien SurgiLink" loading="lazy" />
                                    <figcaption><Pill d="Inscription" /> La fiche médicale, remplie par le patient.</figcaption>
                                </figure>
                                <figure className="sms-card glass rv">
                                    <img src="/landing/sms-j7.png" alt="SMS Medical Alliance : merci de compléter votre dossier J-7 via le lien SurgiLink" loading="lazy" />
                                    <figcaption><Pill d="J-7" /> Le questionnaire de la semaine précédant l&rsquo;opération.</figcaption>
                                </figure>
                            </div>
                            <p className="sms-note rv">Liens personnels floutés : chaque patient reçoit un lien unique et sécurisé.</p>
                        </div>
                    </div>
                </section>

                <div className="divider" aria-hidden="true" />

                {/* Demo */}
                <section className="sec" id="demo" data-reveal>
                    <div className="wrap"><Demo /></div>
                </section>

                {/* Product */}
                <section className="sec" id="produit" data-reveal data-tilt>
                    <div className="wrap">
                        <div className="center">
                            <p className="kicker rv">La plateforme</p>
                            <h2 className="h-sec rv">Un seul outil pour le praticien, l&rsquo;infirmier <em>et le secrétariat.</em></h2>
                        </div>
                        <div className="product product-single">
                            <figure className="shot glass" style={{ margin: 0 }}>
                                <img src="/landing/dashboard.jpg" alt="Tableau de bord SurgiLink : patients actifs, protocoles complets, actions requises, liste des patients par étape" loading="lazy" />
                                <figcaption className="shot-cap"><span><b>Côté équipe.</b> Taux de conformité, actions requises, patients filtrables par étape.</span></figcaption>
                            </figure>
                            
                        </div>
                        <div className="phones">
                            {[
                                ['/landing/app-equipe-mobile.png', 'Côté équipe, sur mobile', 'Alarme, scanner, nouveau patient, planning : tout le tableau de bord dans la poche.', 'Tableau de bord SurgiLink sur mobile'],
                                ['/landing/portail-bienvenue.png', 'Côté patient', 'Un lien reçu par SMS, sans application à installer.', 'Écran de bienvenue du portail patient SurgiLink'],
                                ['/landing/portail-suivi.png', 'Le parcours expliqué', 'Le patient sait quand et pourquoi il reçoit chaque SMS.', 'Écran d\u2019explication du suivi par SMS'],
                                ['/landing/portail-accueil.png', 'Son espace', 'Compte à rebours, questionnaires à jour, rappel de l\u2019intervention.', 'Accueil du portail patient avec compte à rebours et rappel de l\u2019intervention'],
                            ].map(([src, t, p, alt]) => (
                                <figure key={src} className="phone-card rv">
                                    <div className="phone-frame glass"><img src={src} alt={alt} loading="lazy" /></div>
                                    <figcaption><b>{t}</b><span>{p}</span></figcaption>
                                </figure>
                            ))}
                        </div>
                        <div className="features">
                            {[
                                ['Nouveau patient en 10 secondes', 'Saisissez son numéro : il reçoit un lien et remplit lui-même sa fiche.'],
                                ['Import Doctolib et Hospital Manager', 'Une capture d’écran du dossier ou du rendez-vous suffit à préremplir le patient.'],
                                ['J+1 trié avant 8 heures', 'Signal anormal, pas de réponse, tout va bien : l’infirmière commence par ceux qui en ont besoin.'],
                                ['Consignes toujours accessibles', 'Jeûne, douche, arrêt du tabac, soins de cicatrice : dans le portail, pas seulement dans un SMS.'],
                                ['Ordonnances et lettre au médecin', 'Visibles et téléchargeables, sans risque de perte du papier.'],
                                ['Accessible à tous', 'Lecture vocale des consignes, compatibilité VoiceOver et TalkBack, contrastes renforcés.'],
                            ].map(([t, p]) => (
                                <div key={t} className="feat rv">
                                    <span className="fi" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
                                    <h4>{withPills(t)}</h4>
                                    <p>{p}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="divider" aria-hidden="true" />

                {/* Trust */}
                <section className="sec center" id="confiance" data-reveal>
                    <div className="wrap">
                        <p className="kicker rv">Données et traçabilité</p>
                        <h2 className="h-sec rv">Un dossier complet, <em>prouvable</em> et protégé.</h2>
                        <div className="trust" style={{ textAlign: 'left' }}>
                            {[
                                ['Santé', 'Hébergement HDS', 'Certifié pour les données de santé, comme la loi l’exige.', '/landing/badge-hds.png', 'Hébergeur certifié données de santé (HDS)'],
                                ['RGPD', 'Droits du patient', 'Information, durée de conservation, droit d’accès, désinscription SMS.', '/landing/badge-rgpd.png', 'Conforme au RGPD, Règlement général sur la protection des données'],
                                ['Preuve', 'Horodatage', 'Chaque SMS envoyé, chaque réponse, chaque document consulté : daté à la minute.'],
                                ['Accès', 'Par rôle', 'Praticien, infirmier, secrétariat : chacun ne voit que ce dont il a besoin.'],
                            ].map(([tag, t, p, badge, balt]) => (
                                <div key={t} className="t-card glass rv">
                                    {badge ? <img className={`t-badge ${tag === 'RGPD' ? 'wide' : ''}`} src={badge} alt={balt} loading="lazy" /> : <span className="tag">{tag}</span>}
                                    <h4>{t}</h4>
                                    <p>{p}</p>
                                </div>
                            ))}
                        </div>
                        <div className="integr rv">
                            <span className="glass">Synthèse PDF</span>
                            <span className="glass">Signature électronique</span>
                            <span className="glass">Doctolib</span>
                            <span className="glass">Hospital Manager</span>
                            <span className="glass">SMS et serveur vocal</span>
                            <span className="glass">PWA mobile et bureau</span>
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="sec center" id="equipe" data-reveal>
                    <div className="wrap">
                        <p className="kicker rv">Conçu au bloc</p>
                        <h2 className="h-sec rv">Né d&rsquo;un chirurgien qui en avait assez <em>des matins perdus.</em></h2>
                        <figure className="collab rv">
                            <img src="/landing/collab.png" alt="Dr Christophe Desouches, chirurgien plasticien, et Robin Masini, concepteur de SurgiLink" loading="lazy" />
                        </figure>
                        <div className="collab-names">
                            <div className="rv">
                                <h4>Dr Christophe Desouches</h4>
                                <p className="role">Chirurgien plasticien, Medical Alliance<br />Marseille et Aix-en-Provence</p>
                            </div>
                            <div className="rv">
                                <h4>Robin Masini</h4>
                                <p className="role">Conception produit et développement<br />Design UX/UI, logiciel métier</p>
                            </div>
                        </div>
                        <div className="places rv">
                            <span className="glass">5 boulevard Notre-Dame, Marseille</span>
                            <span className="glass">Eiffel Park, Aix-en-Provence</span>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="sec" id="contact" data-reveal>
                    <div className="wrap">
                        <div className="final glass">
                            <div className="bg" style={{ backgroundImage: 'url(/landing/hero-ending.jpg)' }} aria-hidden="true" />
                            <div>
                                <p className="kicker rv">Prochaine étape</p>
                                <h2 className="h-sec rv">Voyez SurgiLink tourner sur <em>vos</em> interventions.</h2>
                                <p className="lede rv">Trente minutes de démonstration. Nous chiffrons avec vous les annulations évitables de votre bloc, puis nous lançons un premier pilote.</p>
                                <div className="settle-ctas rv" style={{ justifyContent: 'flex-start' }}>
                                    <Link to="/login" className="btn glass"><span className="shine" />Déjà client ? Accéder à mon espace</Link>
                                </div>
                            </div>
                            <div className="rv"><ContactForm /></div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="sl-foot">
                <div className="wrap">
                    <div className="foot-grid">
                        <div className="foot-brand">
                            <img src="/landing/logo-surgilink.svg" alt="SurgiLink" style={{ height: 84, width: 'auto' }} />
                            <p>Le suivi patient par SMS qui vérifie chaque étape pré-opératoire à temps pour agir, puis accompagne la convalescence.</p>
                        </div>
                        <div>
                            <h5>Produit</h5>
                            <ul>
                                <li><a href="#methode">La méthode</a></li>
                                <li><a href="#parcours">Le parcours</a></li>
                                <li><a href="#demo">Démo</a></li>
                                <li><Link to="/login">Espace pro</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5>Contact</h5>
                            <ul>
                                <li><a href="mailto:contact@robinmasini.com">contact@robinmasini.com</a></li>
                                <li><a href="tel:+33603096001">06 03 09 60 01</a></li>
                                <li>520 rue Frédéric Joliot, Aix-en-Provence</li>
                            </ul>
                        </div>
                        <div>
                            <h5>Powered by</h5>
                            <img src="/landing/medical-alliance.png" alt="Medical Alliance" style={{ height: 64, width: 'auto' }} loading="lazy" />
                        </div>
                    </div>
                    <div className="foot-bottom">
                        <span>© {new Date().getFullYear()} SurgiLink. Tous droits réservés.</span>
                        <span>Séquence d&rsquo;ouverture réalisée avec l&rsquo;aide de l&rsquo;IA.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
