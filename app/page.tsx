import Link from "next/link";

export default function Home() {
  return (
    <>
      <nav>
        <div className="wrap">
          <a href="#" className="logo" aria-label="ClearedBar home">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="3" y="6" width="3" height="22" rx="1" fill="#f5f1e8"/>
              <rect x="26" y="6" width="3" height="22" rx="1" fill="#f5f1e8"/>
              <rect x="3" y="10" width="26" height="3" rx="1.5" fill="#e4572e"/>
              <path d="M8 26 C 12 14, 20 6, 25 17" stroke="#f3a07f" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
            </svg>
            ClearedBar
          </a>
          <ul>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#founder">About</a></li>
          </ul>
          <a href="#pricing" className="btn">Get early access</a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow">College recruiting for track &amp; field</span>
            <h1>Know where your <em>marks</em> can take you.</h1>
            <p className="lead">ClearedBar matches high school track &amp; field athletes with the college programs their PRs actually fit, from D1 to D3, then writes a personalized email to each event coach for you.</p>
            <div className="cta-row">
              <a href="#pricing" className="btn">Find my schools</a>
              <a href="#how" className="btn ghost">See how it works</a>
            </div>
          </div>

          <div className="card" aria-label="Example match results">
            <div className="who">
              <b>High Jump · 6'7"</b>
              <span>Class of 2028 · Mid-Atlantic</span>
            </div>
            <div className="row"><div>D1 Program A<small>Big conference, scoring mark ~7'0"</small></div><span className="tag reach">Reach</span></div>
            <div className="row"><div>D1 Program B<small>Mid-major, roster range 6'6"–6'10"</small></div><span className="tag target">Target</span></div>
            <div className="row"><div>D2 Program C<small>Conference final ~6'6"</small></div><span className="tag target">Target</span></div>
            <div className="row"><div>D3 Program D<small>You'd score at conference</small></div><span className="tag likely">Likely</span></div>
            <p className="note">Example results. Real matches use your marks, grades and preferences.</p>
          </div>
        </div>
      </header>

      <div className="lanes" aria-hidden="true"></div>

      <section className="problem">
        <div className="wrap">
          <div className="sec-head">
            <h2>Track recruiting runs on numbers. Most athletes can't read them.</h2>
            <p>Your mark is your résumé. But figuring out which programs it fits, and getting a coach to notice, is mostly guesswork for high school athletes and their parents.</p>
          </div>
          <div className="stats">
            <div className="stat"><div className="display">"Am I good enough?"</div><p>Athletes don't know if their PR is a D1 walk-on mark, a D2 scholarship mark, or a D3 conference-scoring mark.</p></div>
            <div className="stat"><div className="display">Hundreds of programs</div><p>Researching rosters and conference results school by school takes weeks most families don't have.</p></div>
            <div className="stat"><div className="display">Coaches get flooded</div><p>Generic copy-paste emails get ignored. Coaches respond to athletes who know their program and their event group.</p></div>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <div className="sec-head">
            <h2>How it works</h2>
            <p>Three steps from "I have no idea where to start" to emails in coaches' inboxes.</p>
          </div>
          <div className="steps">
            <div className="step"><div className="num">01</div><h3>Enter your marks</h3><p>Your event(s), PRs, grad year, GPA, and where you'd want to go to school. Takes about two minutes.</p></div>
            <div className="step"><div className="num">02</div><h3>Get your matches</h3><p>Our AI compares your marks to each program's roster and conference results and sorts schools into reach, target and likely.</p></div>
            <div className="step"><div className="num">03</div><h3>Send real emails</h3><p>For every school, ClearedBar drafts a personal email to the event coach, mentioning their program and your marks, ready to send.</p></div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap email">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <h2>Emails coaches actually read</h2>
            <p>Every draft is specific to the school, the event group, and your numbers. No "Dear Coach" templates.</p>
          </div>
          <div className="mail" aria-label="Example coach email">
            <div className="hdr"><b>To:</b> Jumps Coach, D1 Program B<br /><b>Subject:</b> Class of 2028 high jumper, 6'7" PR</div>
            <p>Coach,</p><br />
            <p>My name is Jordan, and I'm a junior high jumper with a <mark>6'7" PR</mark> from this spring's state meet. I've been following your jumps group, and seeing <mark>two of your jumpers score at conference this year</mark> is a big reason your program is at the top of my list.</p><br />
            <p>I'm carrying a 3.6 GPA and would love to learn what you look for in recruits…</p>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <h2>Simple pricing</h2>
            <p>Start free. Upgrade when you're ready to reach out to coaches seriously.</p>
          </div>
          <div className="plans">
            <div className="plan">
              <h3>Free</h3>
              <div className="price">$0</div>
              <ul>
                <li>Athlete profile</li>
                <li>3 school matches</li>
                <li>1 AI-written coach email</li>
              </ul>
              <Link href="/signup" className="btn ghost">Start free</Link>
            </div>
            <div className="plan pro">
              <h3>Pro</h3>
              <div className="price">$9.99<span>/month</span></div>
              <ul>
                <li>Unlimited school matches, D1–D3 &amp; NAIA</li>
                <li>Unlimited personalized coach emails</li>
                <li>Outreach tracker: who replied and when to follow up</li>
                <li>Update your marks and get new matches all season</li>
              </ul>
              <Link href="/signup" className="btn">Get early access</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="founder" id="founder">
        <div className="wrap">
          <div className="badge" aria-hidden="true">R</div>
          <div>
            <blockquote>"I went through track recruiting as a high jumper with no idea which schools my marks were good enough for. I built ClearedBar so the next athlete doesn't have to guess."</blockquote>
            <cite>Robert Allen<span>Founder · High jumper, Penn State Track &amp; Field</span></cite>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>© 2026 ClearedBar · Built by Robert Allen</span>
          <span>ENGR 310 · Penn State</span>
        </div>
      </footer>
    </>
  );
}
