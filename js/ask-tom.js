/* Ask-about-Tom assistant — curated knowledge base + lightweight matcher.
   Static-safe (no API key). The answer engine (findAnswer) is swappable for a
   real LLM proxy later without touching the UI. */
(function () {
  "use strict";

  // --- Knowledge base: PUBLIC build. ---
  // Deliberately contains NO internal product names, codenames, or patent numbers —
  // this file is served unauthenticated and would otherwise defeat the password gate
  // on the case studies. The full project-specific KB lives inside the encrypted pages.
  var KB = [
    {
      k: ["impact", "results", "biggest", "achievement", "accomplish", "roi", "revenue", "money", "value"],
      a: "Tom's flagship is a <strong>0-to-1 AI fraud-detection product</strong> he led as design lead, taken from a blank-page brief to national launch in about eleven months. It won the 2026 BIG Innovation Award and a 2025 “Best Use of AI in Finance” award, and he holds <strong>two granted US patents</strong> from earlier AI work. The business results are significant but confidential — they're in the password-protected case study."
    },
    {
      k: ["ai", "artificial intelligence", "ml", "machine learning", "llm", "agent", "figma make", "claude"],
      a: "AI runs through Tom's work two ways. He <strong>designs AI products</strong> — fraud detection, and a patented ML-prioritized work queue. And he works <strong>AI-native</strong>: he currently designs an <strong>internal AI agent platform</strong> at a Fortune 100 financial services company, using Figma Make for rapid prototyping and Claude Code design sub-agents to automate parts of his design pipeline."
    },
    {
      k: ["peer", "peers", "say", "colleague", "coworker", "work with", "working with", "reference", "testimonial", "like to work", "feedback", "team say"],
      a: "A few things peers consistently say:<br>• A PM: <em>“Tom works SO FAST — he comes up with lots of options so the team can see the visuals before deciding.”</em><br>• Another partner: <em>“Tom was a leading force behind our fraud-prevention research — he's the in-house go-to for the customer's perspective.”</em><br>• A designer he mentored: <em>“I can tell Tom cares about my career and wants me to succeed.”</em>"
    },
    {
      k: ["leave", "leaving", "why", "new role", "looking", "exploring", "next", "move on", "google", "want"],
      a: "Tom's spent 14 years going from art director to design manager, and he's <strong>currently a hands-on IC by choice</strong> (at a manager-level band) — because building is where he does his best work. He's looking for a <strong>senior/staff IC role</strong> at a top product company where he can keep shipping AI products at a high bar."
    },
    {
      k: ["approach", "process", "philosophy", "how does he design", "principles", "style", "think"],
      a: "Tom designs <strong>end-to-end</strong> — research through pixels — with an owner's eye for impact (he also builds his own businesses). A signature move: <strong>making AI legible and trustworthy to users</strong>. He pushed a High/Med/Low confidence indicator on an AI feature; it was deprioritized, then vindicated twice — the team later shipped it, and he shipped it in a subsequent product."
    },
    {
      k: ["lead", "leader", "manage", "management", "mentor", "team", "people"],
      a: "Tom has led design teams (up to six designers) and currently leads a <strong>4-designer team</strong>, owning the design system and visual standards for an AI agent platform. But he's chosen to stay hands-on — he holds a manager-level band while working as an IC, because he loves the craft. Peers describe him as a natural mentor who elevates the people around him."
    },
    {
      k: ["design system", "systems", "component", "atoms", "tokens", "pattern", "library"],
      a: "Tom <strong>owns the design system</strong> that many teams build on — the atoms, the app shell, foundational patterns (tables, filters, snackbars), the responsive standard, and the documentation. He has design-systems pedigree going back to Tantrum Street, where his team built two systems in 2.5 months."
    },
    {
      k: ["patent", "patents", "ip", "invention"],
      a: "Tom holds <strong>two granted US patents</strong> covering ML-driven queue optimization — he designed the interface for the AI system they cover. Patent numbers and details are in the full case study, which is password protected."
    },
    {
      k: ["experience", "background", "history", "worked", "companies", "career", "resume", "years", "capital one", "dish", "tantrum"],
      a: "14 years across brand and product. At <strong>Capital One</strong> (8 years) he's gone Associate → Senior → Principal → Lead → Design Manager, across underwriting platforms, consumer lead generation, fraud prevention, and now an internal AI agent platform. Before that: <strong>Tantrum Street</strong> (FinTech design lead) and <strong>DISH Network</strong> (UX + art direction)."
    },
    {
      k: ["metric", "metrics", "numbers", "stats", "kpi", "nps", "quantif"],
      a: "Tom's work carries real, measurable business impact — revenue, fraud prevented, NPS lifts, adoption rates, and two granted patents. The specific figures belong to a former employer, so they live in the <strong>password-protected case studies</strong> rather than on the public page. The password is on his resume, or email <a href=\"mailto:tbusath@gmail.com\">tbusath@gmail.com</a>."
    },
    {
      k: ["fit", "hire", "why hire", "strength", "good at", "staff", "senior", "google fit"],
      a: "Tom's targeting a <strong>senior/staff IC product design role</strong> — ideally somewhere pushing AI forward. He brings a rare combination: enterprise-scale impact, real craft, granted IP, an AI-native way of working, and a builder's mindset from running his own businesses."
    },
    {
      k: ["case study", "case studies", "portfolio", "password", "see the work", "view work", "locked", "private", "access"],
      a: "The case studies are <strong>password protected</strong> — they cover confidential enterprise work, so Tom shares them on request. Email <a href=\"mailto:tbusath@gmail.com\">tbusath@gmail.com</a> and he'll send the password, usually within the hour."
    },
    {
      k: ["contact", "reach", "email", "talk", "connect", "hire him", "get in touch", "linkedin"],
      a: "Want to talk to Tom directly? Reach him at <a href=\"mailto:tbusath@gmail.com\">tbusath@gmail.com</a> or on <a href=\"https://www.linkedin.com/in/tbusath\" target=\"_blank\" rel=\"noopener\">LinkedIn</a>. He can also send you the password for the full case studies."
    }
  ];

  var FALLBACK = "I can tell you about Tom's <strong>biggest impact</strong>, his <strong>AI work</strong>, <strong>what peers say</strong> about him, how he <strong>approaches design</strong>, or his <strong>experience</strong>. Try a suggestion below, or ask your own question.";

  var GREETING = "Hi — I'm an assistant trained on Tom's work and on feedback from people who've worked with him. Ask me anything, or tap a suggestion.";

  function findAnswer(query) {
    var q = " " + query.toLowerCase().replace(/[^a-z0-9\s]/g, " ") + " ";
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var score = 0;
      for (var j = 0; j < KB[i].k.length; j++) {
        var kw = KB[i].k[j];
        if (q.indexOf(" " + kw) !== -1 || q.indexOf(kw + " ") !== -1 || q.indexOf(kw) !== -1) {
          score += kw.length > 4 ? 2 : 1; // longer keywords weigh more
        }
      }
      if (score > bestScore) { bestScore = score; best = KB[i]; }
    }
    return bestScore > 0 ? best.a : FALLBACK;
  }

  // --- UI ---
  document.addEventListener("DOMContentLoaded", function () {
    var thread = document.getElementById("aiThread");
    var form = document.getElementById("aiForm");
    var input = document.getElementById("aiInput");
    var suggest = document.getElementById("aiSuggest");
    if (!thread || !form || !input) return;

    function bubble(role, html, animate) {
      var el = document.createElement("div");
      el.className = "ai-msg ai-msg--" + role;
      var body = document.createElement("div");
      body.className = "ai-bubble";
      el.appendChild(body);
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
      if (animate) {
        revealWords(body, html);
      } else {
        body.innerHTML = html;
      }
      return body;
    }

    function revealWords(body, html) {
      var words = html.split(" ");
      var i = 0;
      (function step() {
        body.innerHTML = words.slice(0, ++i).join(" ");
        thread.scrollTop = thread.scrollHeight;
        if (i < words.length) setTimeout(step, 18);
      })();
    }

    function ask(query) {
      if (!query) return;
      bubble("user", query.replace(/</g, "&lt;"), false);
      if (suggest) suggest.classList.add("is--hidden");
      var typing = bubble("bot", "<span class=\"ai-dots\"><span></span><span></span><span></span></span>", false);
      // after a brief "thinking" pause, replace the dots with the answer
      setTimeout(function () {
        typing.innerHTML = "";
        revealWords(typing, findAnswer(query));
      }, 520);
    }

    // greeting
    bubble("bot", GREETING, false);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = "";
      ask(v);
    });

    if (suggest) {
      suggest.addEventListener("click", function (e) {
        var btn = e.target.closest(".ai-chip");
        if (!btn) return;
        ask(btn.getAttribute("data-q") || btn.textContent.trim());
      });
    }
  });
})();
