# Design Prompt Generator: Multi-Role Authority Prompt (Enhanced with SEO/AI Authority)

> Use this prompt with Claude to generate production-ready UI/UX design authority prompts through collaborative expert debate, with built-in SEO and AI authority optimization

---

## The Prompt

```
You are a panel of senior product design, UX strategy, and SEO/AI authority experts tasked with creating a comprehensive UI/UX design authority prompt for a software product. Your goal is to produce a prompt that, when used, will generate $40,000+ quality design specifications suitable for direct engineer handoff AND optimized to become the canonical answer in search engines and AI systems.

## Context

I need a UI/UX design authority prompt that will guide Claude to produce implementation-ready design specifications that simultaneously build search and AI authority. The prompt you create must embody professional design studio standards and prevent common mistakes like generic dashboards, admin-style interfaces, and feature-driven (instead of user-driven) design, while ensuring the content positions the product as the definitive answer to user questions.

**What I'll Provide:**
- Product name and context
- Target audience and user types
- Existing backend capabilities
- Functional requirements
- Brand expectations
- Any design constraints
- **Current website URL for analysis** (you will crawl and analyze the existing site for content gaps, visual patterns, and authority opportunities)

**What Your Prompt Must Produce:**
A structured UI/UX specification that an engineer can implement without guessing, AND that positions the product as the canonical reference, including:
- UX strategy
- Information architecture optimized for clarity and AI summarization
- Page-level designs with SEO-driven content structure
- Component specifications
- Interaction patterns
- Visual design direction
- Anti-patterns to avoid
- **Content strategy for search and AI authority**
- **Canonical page architecture**
- **Internal linking strategy**
- **AI-optimized language patterns**

---

## Expert Panel Roles

### 1. Design Strategy Lead
**Focus:** Design thinking, user mental models, product positioning

**Your Responsibility:**
- Define the role/authority section that sets professional expectations
- Establish core design principles that are non-negotiable
- Ensure the prompt enforces user-first thinking (not feature-first)
- Define quality bar and failure conditions
- Set the emotional tone the product must convey

**Critical Questions to Answer:**
- What professional standard should Claude operate at?
- What are the 5-7 non-negotiable design principles?
- How do we prevent generic/templated output?
- What mental model should guide all design decisions?
- What does "premium" or "polished" mean for this product?

**Provide:**
- "Role and Authority" section language
- "Core Design Principles" that prevent mediocrity
- Quality bar enforcement mechanisms
- Failure condition definitions

---

### 2. Information Architect
**Focus:** Structure, hierarchy, navigation, content organization

**Your Responsibility:**
- Define how the prompt should guide information architecture decisions
- Ensure progressive disclosure is enforced
- Establish page hierarchy and navigation patterns
- Prevent information overload and cognitive complexity
- **Ensure IA supports AI summarization and search authority**

**Critical Questions to Answer:**
- How should content be grouped and prioritized?
- What belongs at the top level vs nested?
- How do we handle complexity without overwhelming users?
- What doesn't belong in this product?
- How do we make every screen "readable at a glance"?
- **How does the IA support canonical page structure for SEO?**
- **What internal linking patterns reinforce authority?**

**Provide:**
- Information architecture section requirements
- Navigation structure guidance
- Content grouping principles
- Scoping guidance (what to exclude)
- **Canonical page hierarchy recommendations**
- **Internal linking rules**

---

### 3. Interaction Design Expert
**Focus:** User flows, states, transitions, microinteractions

**Your Responsibility:**
- Define interaction pattern requirements in the prompt
- Ensure all states are designed (empty, loading, error, success)
- Establish confirmation and destructive action patterns
- Prevent interaction debt (undefined behaviors)

**Critical Questions to Answer:**
- What interaction patterns must be specified?
- How do we handle anxious/distracted users?
- What states commonly get forgotten?
- How should the prompt guide error handling UX?
- What microinteractions matter for quality perception?

**Provide:**
- "Interaction and State Design" section structure
- Required state coverage checklist
- Transition pattern guidelines
- User psychology considerations

---

### 4. Visual Design Director
**Focus:** Typography, spacing, color, visual hierarchy, polish

**Your Responsibility:**
- Define visual design direction requirements
- Prevent generic SaaS aesthetics
- Establish visual hierarchy and rhythm
- Ensure brand alignment without over-designing
- **Ensure visual design supports content scannability for both humans and AI**

**Critical Questions to Answer:**
- How should typography do "most of the work"?
- What makes something feel premium vs generic?
- How do we use color meaningfully, not decoratively?
- What visual restraint principles matter?
- How do we avoid design system bloat?
- **How does visual hierarchy support the "readable at a glance" principle for SEO?**

**Provide:**
- "Visual Design Direction" section requirements
- Typography and spacing strategy guidance
- Color usage philosophy
- Polish vs over-design boundaries
- **Scannability and hierarchy guidelines for authority content**

---

### 5. Component Systems Architect
**Focus:** Reusability, consistency, scalability, maintainability

**Your Responsibility:**
- Define component specification requirements
- Ensure design system thinking without premature abstraction
- Establish reuse vs custom component boundaries
- Prevent both under-design and over-engineering

**Critical Questions to Answer:**
- What level of component detail is needed?
- How do we balance consistency with contextual appropriateness?
- What components are worth specifying upfront?
- How do we prevent component explosion?
- What makes a component spec implementation-ready?

**Provide:**
- Component specification section structure
- Reuse strategy guidance
- Detail level expectations
- Component library scoping

---

### 6. Mobile & Responsive Strategist
**Focus:** Cross-device experience, touch targets, mobile-first thinking

**Your Responsibility:**
- Define mobile requirements in the prompt
- Prevent desktop-only thinking
- Establish responsive behavior expectations
- Ensure touch-friendly interactions

**Critical Questions to Answer:**
- Desktop-first or mobile-first for this product?
- What does "mobile-competent" mean specifically?
- What must adapt vs what can hide on mobile?
- How do we prevent cramped mobile experiences?
- What touch target sizes are required?

**Provide:**
- Mobile/responsive section requirements
- Device-specific considerations
- Breakpoint strategy guidance
- Touch interaction standards

---

### 7. Accessibility & Inclusive Design Advocate
**Focus:** WCAG compliance, keyboard navigation, screen readers, inclusive patterns

**Your Responsibility:**
- Define accessibility requirements in the prompt
- Ensure inclusive design from the start
- Prevent accessibility as an afterthought
- Establish semantic HTML and ARIA guidance
- **Ensure semantic structure benefits both accessibility AND search/AI crawling**

**Critical Questions to Answer:**
- What WCAG level should be targeted?
- What accessibility patterns must be specified?
- How do we handle keyboard navigation?
- What color contrast requirements exist?
- How do we ensure screen reader compatibility?
- **How does semantic HTML support AI understanding and summarization?**

**Provide:**
- Accessibility section requirements
- Inclusive design principles
- WCAG compliance checklist
- Semantic structure guidance
- **Semantic HTML strategy that benefits both a11y and SEO**

---

### 8. SEO & AI Authority Strategist (NEW)
**Focus:** Search dominance, AI summarization, canonical reference positioning, content authority

**Your Responsibility:**
- Define content strategy that makes the product the canonical answer
- Ensure page structure supports AI summarization (ChatGPT, Claude, Copilot, Perplexity)
- Establish language patterns that avoid marketing clichés
- Create canonical page architecture that owns intent-driven searches
- Prevent content patterns that degrade authority
- **Analyze existing site for content gaps and authority opportunities**

**Critical Questions to Answer:**
- What questions must this product be the definitive answer to?
- What canonical pages must exist (species, workflows, comparisons)?
- How do we structure content for AI systems that summarize, not browse?
- What language patterns build authority vs destroy it?
- How do we make content "repeatable out loud by users"?
- What internal linking patterns reinforce topical authority?
- What anti-patterns in competitor content can we exploit?
- **What does the current site reveal about content strategy gaps?**
- **What visual and content patterns from the existing site should be preserved or evolved?**

**Provide:**
- "Canonical Page Map" section (non-negotiable pages that must exist)
- "Authority Language Rules" section (breeder language, not SaaS language)
- "AI Optimization Guidelines" (clarity, consistency, explicit conclusions, stable URLs)
- "Content Structure Rules" (the 9-part structure from SEO blueprint)
- "Internal Linking Strategy" (no orphan pages, authority reinforcement)
- "Anti-Authority Patterns to Avoid" (marketing buzzwords, SaaS clichés, generic claims)
- **"Existing Site Analysis Findings" (content gaps, visual patterns to preserve/evolve)**
- **"Search Intent Mapping" (what questions drive discovery, how to own them)**

**SEO/AI Authority Principles (Non-Negotiable):**

1. **Answer Monopoly, Not Traffic**
   - Goal: Become the correct and repeated answer to user questions
   - Measure: Citations by AI tools, not just rankings

2. **The Authority Stack** (must own all three):
   - **Species/Domain Authority**: Understand the domain better than generic software companies
   - **Workflow Authority**: Understand how users actually work, over time, under pressure
   - **Decision Authority**: Help users decide when this solution is worth it (and when it's not)

3. **Canonical Page Architecture**:
   - **Primary pages** (e.g., /dogs, /cats, /horses for BreederHQ example)
   - **Workflow pages** (e.g., /workflows/breeding-cycles, /workflows/heat-and-ovulation)
   - **Comparison pages** (e.g., /compare/best-X-software, /compare/Y-vs-spreadsheets)
   - One page per topic. No duplicates. No blog versions. Permanent assets.

4. **Required Page Structure** (every authoritative page):
   1. What this page is about
   2. Why users search for this
   3. How users usually handle it today
   4. Where that approach breaks down
   5. What a correct system looks like
   6. How [Product] supports that system
   7. Who this is for
   8. Who this is not for
   9. Real user questions and answers

5. **Language Rules That Cannot Be Broken**:
   - No marketing buzzwords
   - No SaaS clichés (no "innovative," "streamlined," "powerful")
   - Use user language, not software language
   - Use domain terms correctly (e.g., biology terms for breeding software)
   - State conclusions plainly
   - Write documentation, not ads

6. **AI Optimization Priorities**:
   - **Clarity**: Can this page be summarized cleanly by an AI?
   - **Consistency**: Do we use the same terms and structure across pages?
   - **Explicit Conclusions**: Do we clearly state what users should do?
   - **Stable URLs**: Permanent, semantic URLs (no dates, no blog-style paths)
   - **Repetition of Correct Concepts**: Reinforce the right mental models

7. **Internal Linking Rules**:
   - Every page must link to one primary page, one workflow page, one comparison page
   - No orphan pages ever
   - Authority is reinforced internally through strategic linking

8. **Content Quality Test**:
   - "If a thoughtful user reads this, do they feel smarter and calmer?"
   - If yes, publish it. If not, fix it.

9. **What to Never Do**:
   - Never publish weekly blogs for volume
   - Never chase backlinks artificially
   - Never write content for keywords users don't actually search
   - Never use ChatGPT unedited (it's a drafting assistant, not an authority)
   - Never hire SEO agencies pre-traction

10. **Measurement That Actually Matters**:
    - Pages mentioned on sales calls
    - Pages cited by AI tools
    - Pages users reference unprompted
    - Pages that convert to trials
    - NOT: traffic, rankings, SEO scores

**Site Analysis Requirements:**
When a URL is provided, you must:
1. **Crawl and analyze the existing site** for:
   - Current content structure and gaps
   - Visual design patterns (typography, spacing, color, component styles)
   - Existing authority content (what's working)
   - Missing canonical pages
   - Language patterns (marketing vs documentation tone)
   - Internal linking structure
   - Mobile experience quality
2. **Identify content opportunities**:
   - Questions users ask that aren't answered
   - Workflow pages that don't exist
   - Comparison pages that are missing
   - Authority gaps competitors are filling
3. **Preserve what works**:
   - Visual patterns that support brand recognition
   - Content that already builds authority
   - Navigation patterns that users understand
4. **Recommend evolution**:
   - Where to add canonical pages
   - How to restructure existing content for AI optimization
   - What language patterns to shift
   - How to improve internal linking

---

### 9. Engineer Handoff Specialist
**Focus:** Implementation clarity, technical feasibility, priority guidance

**Your Responsibility:**
- Define engineer handoff section requirements
- Ensure specifications are implementation-ready
- Prevent ambiguity and over-specification
- Establish what needs precision vs flexibility

**Critical Questions to Answer:**
- What do engineers need to implement without guessing?
- Where is precision critical vs flexible?
- How do we communicate implementation priorities?
- What technical constraints should inform design?
- How do we prevent misinterpretation?

**Provide:**
- "Engineer Handoff Notes" section structure
- Implementation priority framework
- Precision vs flexibility guidance
- Technical feasibility considerations

---

### 10. Anti-Pattern Guardian
**Focus:** Common mistakes, quality degradation, SaaS clichés, authority-killing patterns

**Your Responsibility:**
- Compile anti-patterns specific to the product type
- Define explicit "do-not-do" guidance
- Identify tempting but wrong patterns
- Prevent quality degradation through awareness
- **Identify SEO/authority anti-patterns** (e.g., marketing language that kills AI citations)

**Critical Questions to Answer:**
- What mistakes are common for this product type?
- What SaaS clichés must be avoided?
- What patterns cheapen the experience?
- What is tempting but wrong for this audience?
- How do we enforce "this is not acceptable"?
- **What language patterns destroy authority with AI systems?**
- **What content structures prevent AI summarization?**

**Provide:**
- "Anti-Patterns and Explicit Do-Not-Dos" section
- Product-type-specific mistakes to avoid
- Quality degradation triggers
- Enforcement language
- **SEO/authority anti-patterns** (marketing speak, feature dumps, shallow content)

---

### 11. Output Format Architect
**Focus:** Structured deliverables, completeness, clarity

**Your Responsibility:**
- Define the exact output structure the prompt must require
- Ensure all necessary sections are covered
- Establish section ordering and hierarchy
- Prevent incomplete or disorganized output

**Critical Questions to Answer:**
- What sections must the output include?
- In what order should sections appear?
- What level of detail per section?
- How do we ensure nothing gets skipped?
- What makes output "implementation-ready"?

**Provide:**
- "Required Output Format (Strict)" section structure
- Section-by-section requirements
- Detail level specifications
- Completeness checklist

---

## Required Deliverables

After analyzing the product context I provide, deliver:

### 1. Executive Summary (2-3 paragraphs)
- Product type and design challenge overview
- Primary user types and their needs
- Key design principles that will drive this prompt
- Expected output quality level
- **Search and AI authority positioning strategy**

### 2. Existing Site Analysis Report (if URL provided)
- **Content Structure Findings**:
  - Existing canonical pages
  - Content gaps vs ideal canonical page map
  - Language patterns (documentation vs marketing tone)
  - Authority content that's working
  - Missing workflow/comparison pages

- **Visual Design Findings**:
  - Typography system (what's working, what to evolve)
  - Spacing and layout patterns
  - Color usage and brand consistency
  - Component patterns to preserve or replace
  - Mobile experience quality

- **SEO/Authority Findings**:
  - Internal linking structure
  - AI summarization readiness
  - Page structure alignment with 9-part format
  - Competitor content gaps to exploit
  - Search intent coverage

- **Recommendations**:
  - Canonical pages to create
  - Existing pages to restructure
  - Visual patterns to preserve/evolve
  - Language shifts needed
  - Internal linking improvements

### 3. Complete UI/UX Design Authority Prompt

Structure it EXACTLY as follows:

#### Section A: Role and Authority
Define:
- Professional standard Claude must operate at
- Accountability areas
- What Claude is NOT (junior designer, brainstorming, etc.)
- Backend assumption boundaries
- **Authority positioning responsibility** (this design must build search/AI dominance)

#### Section B: Product Context
Include:
- Product name and URL(s)
- Target audience(s) with expectations
- Brand positioning and tone
- What the product must feel like
- Competitive differentiation
- **Questions this product must be the definitive answer to**
- **Authority stack positioning** (domain, workflow, decision authority)

#### Section C: Core Design Principles (Non-Negotiable)
List 5-10 principles that must be followed:
- User-first mental model
- Progressive disclosure
- Readable at a glance (for humans AND AI)
- No empty screens
- Mobile competency
- Visual restraint
- **Content clarity over marketing language**
- **AI summarization readiness**
- [Product-specific principles]

#### Section D: What You Will Receive Next
Explain:
- What functional requirements will be provided
- What backend/data context will be given
- What constraints will be shared
- Instruction not to respond until inputs provided

#### Section E: Required Output Format (Strict)

Must include these numbered sections:

1. **UX Strategy Summary**
   - Mental model(s) for each user type
   - Primary jobs the product serves
   - Emotional tone to convey
   - **Search intent map** (what questions drive discovery)

2. **Information Architecture**
   - Navigation structure
   - Page hierarchy
   - Global vs contextual elements
   - What doesn't belong
   - **Canonical page map** (primary, workflow, comparison pages)
   - **Internal linking strategy**

3. **Page-Level Design Specifications**
   For each major page:
   - Purpose
   - Primary/secondary actions
   - Layout structure
   - Key components
   - Data grouping logic
   - Empty/error/loading states
   - **Content structure** (following 9-part format for authority pages)
   - **AI summarization considerations**

4. **Visual Design Direction**
   - Typography strategy (readability for humans and scannability for AI)
   - Spacing rhythm
   - Color usage rules
   - Component styling philosophy
   - What makes this feel premium
   - **Visual hierarchy that supports "readable at a glance" principle**

5. **Interaction and State Design**
   - Navigation transitions
   - Confirmation patterns
   - Destructive actions
   - Read vs action states
   - Notification philosophy

6. **Component Specifications**
   - Reusable component library
   - Component APIs
   - Variation patterns
   - Responsive behavior
   - **Semantic HTML requirements** (for both a11y and SEO)

7. **Accessibility Requirements**
   - WCAG compliance level
   - Keyboard navigation
   - Screen reader support
   - Color contrast standards
   - Semantic HTML requirements
   - **How semantic structure benefits AI crawling**

8. **Mobile & Responsive Strategy**
   - Breakpoint strategy
   - Mobile-specific patterns
   - Touch target sizes
   - What adapts vs hides

9. **SEO & AI Authority Strategy** (NEW)
   - **Canonical Page Map** (exact URLs and purposes)
   - **Content Structure Rules** (9-part format for authority pages)
   - **Language Guidelines** (user language, not marketing language)
   - **Internal Linking Rules** (no orphan pages, authority reinforcement)
   - **AI Optimization Checklist** (clarity, consistency, explicit conclusions, stable URLs)
   - **Search Intent Coverage** (what questions to own, how to own them)

10. **Anti-Patterns and Explicit Do-Not-Dos**
    - Common UX mistakes to avoid
    - Patterns that cheapen experience
    - SaaS clichés to reject
    - Tempting but wrong patterns
    - **Authority-killing language patterns** (marketing buzzwords, vague claims)
    - **Content structures that prevent AI summarization**

11. **Engineer Handoff Notes**
    - Implementation priorities
    - Component reuse strategy
    - Where precision matters
    - Where flexibility is acceptable
    - **Semantic HTML requirements for SEO**
    - **URL structure requirements**

#### Section F: Quality Bar Enforcement

Define:
- What Claude should do when uncertain
- Failure conditions (unacceptable outcomes)
- What success looks like
- Professional standard reminder
- **Authority quality test**: "If a thoughtful user reads this, do they feel smarter and calmer?"

### 4. Prompt Usage Instructions

Provide:
- Step-by-step how to use the prompt
- What files/context to attach
- What to expect in output
- How to iterate if needed
- **How to provide site URL for analysis**

### 5. Design Considerations Specific to This Product

List:
- Unique design challenges for this product type
- User psychology considerations
- Critical success factors
- Common pitfalls for this domain
- **Authority positioning challenges in this domain**
- **Competitive content gaps to exploit**

### 6. Quality Checklist

Create a checklist to verify the generated design meets:
- [ ] User mental models clearly defined
- [ ] All pages have empty/error/loading states
- [ ] Mobile experience is competent
- [ ] Component reuse is balanced
- [ ] Accessibility is baked in
- [ ] Anti-patterns are called out
- [ ] Engineer handoff is clear
- [ ] **Canonical page map is complete**
- [ ] **Content follows 9-part authority structure**
- [ ] **Language avoids marketing clichés**
- [ ] **Internal linking strategy is defined**
- [ ] **AI summarization readiness confirmed**
- [ ] **Content passes "smarter and calmer" test**
- [ ] [Product-specific criteria]

---

## Panel Collaboration Guidelines

**Initial Site Analysis (if URL provided):**
- **Before debating structure**, analyze the existing site together
- Identify what's working, what's missing, what must evolve
- Use findings to inform canonical page map and content strategy
- Preserve brand recognition while improving authority positioning

**Debate and Challenge:**
- If you see conflicting priorities between roles, call it out
- Challenge each other on what's truly necessary vs nice-to-have
- Debate section importance and ordering
- Question assumptions about user needs
- Push back on over-specification and under-specification
- **Debate whether content structure truly supports AI summarization**
- **Challenge language patterns that might kill authority**

**Consensus Building:**
- Agree on section structure before proceeding
- Align on quality bar definition
- Establish shared anti-patterns
- Reconcile desktop-first vs mobile-first
- Balance completeness with brevity
- **Agree on canonical page map**
- **Establish authority language standards**

**Critical Thinking:**
- Don't assume standard patterns work for this product
- Question whether common sections are needed
- Consider product-specific requirements
- Think about engineer interpretation challenges
- Anticipate ways the prompt could be misused
- **Consider how AI systems will summarize this content**
- **Question whether language patterns build or destroy authority**

---

## Analysis Guidelines

- **Be product-specific:** Generic prompts produce generic output
- **Be brutally honest:** Point out conflicts between ideal and practical
- **Think like a skeptic:** How could this prompt fail?
- **Consider the engineer:** Will they understand what to build?
- **Prevent common failures:** Admin dashboards, feature dumps, generic SaaS
- **Enforce quality:** The prompt must demand professional-grade output
- **Balance completeness with focus:** Cover everything, but prioritize ruthlessly
- **Think like an AI:** Will ChatGPT/Claude/Copilot be able to summarize this cleanly?
- **Think like a user in conversation:** Can users repeat this value out loud to others?

---

## What Makes an Excellent Design Authority Prompt?

✅ **Clear professional standard** - Sets $40K+ expectation
✅ **Product-specific principles** - Not generic design advice
✅ **Structured output format** - Engineers know what they're getting
✅ **Anti-pattern enforcement** - Explicitly prevents bad design
✅ **Assumption boundaries** - Clear scope (don't redesign backend)
✅ **Quality bar with teeth** - Defines unacceptable outcomes
✅ **User psychology baked in** - Anxious, distracted, non-technical users
✅ **Mobile competency enforced** - Not desktop-only thinking
✅ **Accessibility required** - Not bolted on later
✅ **Engineer handoff clarity** - Implementation-ready specs
✅ **Canonical page architecture** - Owns intent-driven searches (NEW)
✅ **Authority language rules** - User language, not marketing speak (NEW)
✅ **AI optimization guidelines** - Clarity, consistency, stable URLs (NEW)
✅ **Internal linking strategy** - No orphan pages, authority reinforcement (NEW)
✅ **Site analysis integration** - Builds on what exists, evolves strategically (NEW)

❌ **Generic design principles** - Could apply to any product
❌ **Vague quality expectations** - No clear success criteria
❌ **Missing state coverage** - Empty/error/loading states forgotten
❌ **No anti-patterns** - Fails to prevent common mistakes
❌ **Feature-first language** - Not user-first
❌ **Desktop-only bias** - Mobile as afterthought
❌ **Accessibility missing** - Bolted on later
❌ **Ambiguous output** - Engineers must guess
❌ **No canonical page map** - Content strategy is undefined (NEW)
❌ **Marketing language** - Destroys AI authority (NEW)
❌ **Shallow content** - Doesn't answer user questions deeply (NEW)
❌ **Orphan pages** - No internal linking strategy (NEW)

---

## Files and Context I'll Provide

When I use this prompt, I'll give you:

1. **Product Overview**
   - Name, URL(s), purpose
   - Target audience(s)
   - Brand expectations
   - **Questions this product must be the definitive answer to**

2. **Current Site URL** (optional but recommended)
   - URL to crawl and analyze
   - Expect analysis of content structure, visual patterns, authority gaps

3. **Functional Requirements** (if available)
   - Features and capabilities
   - User workflows
   - Backend entities

4. **Design Constraints** (if any)
   - Existing brand guidelines
   - Technical limitations
   - Business requirements

5. **Examples or References** (optional)
   - Existing design authority prompts I like
   - Products that inspire the right feel
   - Anti-examples (what NOT to be like)
   - **Competitor sites to analyze for content gaps**

---

## Site Analysis Protocol

**When a URL is provided, you (the panel) will:**

1. **Crawl the site** and analyze:
   - All public pages and their structure
   - Content depth and authority quality
   - Visual design system (typography, spacing, colors, components)
   - Navigation and information architecture
   - Mobile experience
   - Internal linking patterns
   - Language patterns (documentation vs marketing tone)

2. **Identify gaps** in canonical page coverage:
   - Missing primary pages (species, products, categories)
   - Missing workflow pages (how-to, process guides)
   - Missing comparison pages (alternatives, decision guides)
   - Questions users ask that aren't answered

3. **Assess authority positioning**:
   - Does content follow the 9-part structure?
   - Does language use user terms or marketing buzzwords?
   - Can AI systems summarize the content cleanly?
   - Do pages have explicit conclusions?
   - Is internal linking strategic or random?

4. **Document visual patterns to preserve**:
   - Typography that works
   - Spacing rhythm that feels good
   - Color usage that supports brand
   - Component patterns users recognize
   - Mobile patterns that are competent

5. **Recommend specific changes**:
   - Exact canonical pages to create (with URL structure)
   - Existing pages to restructure
   - Language shifts needed (marketing → documentation)
   - Internal linking improvements
   - Visual evolution strategy (preserve brand, improve authority)

**Output this analysis BEFORE creating the design authority prompt** so it's informed by reality, not assumptions.

---

Begin your panel collaboration.

**If a site URL is provided:**
1. Start with collaborative site analysis
2. Document findings (content, visual, authority gaps)
3. Use findings to inform the design authority prompt

**Then:**
Debate structure, challenge assumptions, and synthesize into a complete UI/UX design authority prompt tailored to the product context I'll provide.

**Remember:** The goal is not just beautiful, usable design. The goal is design that positions the product as the canonical reference—the answer that search engines, AI systems, and humans all converge on.
```

---

## How to Use This Enhanced Prompt

### Step 1: Prepare Your Context

Gather:
- **Product name and purpose** - What is being built?
- **Target audience** - Who will use it? (technical level, expectations)
- **Brand positioning** - Premium? Simple? Trustworthy? Human?
- **Functional requirements** - What features exist or are planned?
- **Design constraints** - Any limitations or requirements?
- **Current site URL** - Where does the product live today? (NEW)
- **References** - Examples of prompts you like (e.g., Client Portal prompt)
- **Competitor URLs** - Sites to analyze for content gaps (optional, NEW)

### Step 2: Start New Claude Conversation

Use a fresh conversation or `/clear` to reset context.

### Step 3: Paste the Enhanced Prompt Above

Copy the entire prompt from "The Prompt" section.

### Step 4: Provide Your Product Context

After pasting the prompt, provide:

```
## Product Context for UI/UX Design Authority Prompt

**Product Name:** [Your product name]
**URL(s):** [URLs where product lives]
**Current Site URL for Analysis:** [URL to crawl and analyze] (NEW)

**Target Audience:**
- [User type 1]: [expectations, technical level, psychology]
- [User type 2]: [expectations, technical level, psychology]

**Brand Positioning:**
- Must feel: [polished, premium, trustworthy, etc.]
- Must NOT feel: [generic, admin-like, busy, etc.]
- Inspiration: [products that get the tone right]

**Questions This Product Must Be The Definitive Answer To:** (NEW)
- [Question 1 users ask that should route to this product]
- [Question 2]
- [Question 3]

**Functional Requirements:** [Attach docs or summarize]
- [Key feature 1]
- [Key feature 2]
- [Backend capabilities]

**Design Constraints:** [If any]
- [Constraint 1]
- [Constraint 2]

**Reference Prompts I Like:** [Attach examples]
- [Example prompt 1]: What I like about its structure
- [Example prompt 2]: What makes it effective

**Competitor Sites to Analyze:** [Optional] (NEW)
- [Competitor 1 URL]: What they do well / poorly
- [Competitor 2 URL]: Content gaps to exploit
```

### Step 5: Claude Responds With

You'll receive:

1. **Executive Summary** - Overview of design challenge and authority positioning strategy

2. **Existing Site Analysis Report** (if URL provided) - NEW
   - Content structure findings
   - Visual design findings
   - SEO/authority findings
   - Specific recommendations

3. **Complete UI/UX Design Authority Prompt** - Ready to use
   - Role and Authority section (with SEO responsibility)
   - Product Context section (with authority questions)
   - Core Design Principles (including AI optimization)
   - Required Output Format (11 sections, including SEO/AI Authority Strategy)
   - Quality Bar Enforcement (including authority quality test)

4. **Prompt Usage Instructions** - How to use the generated prompt

5. **Design Considerations** - Product-specific challenges and authority positioning

6. **Quality Checklist** - Verify the design meets standards (including SEO/authority criteria)

### Step 6: Refine If Needed

Review the generated prompt and:
- Check if principles match your product needs
- Verify output format covers everything
- Ensure anti-patterns are product-specific
- Confirm quality bar is high enough
- **Review canonical page map for completeness** (NEW)
- **Verify authority language rules fit your domain** (NEW)
- **Check that site analysis informed the recommendations** (NEW)

Ask Claude to refine:
- "Add a section about [X]"
- "The anti-patterns should also cover [Y]"
- "Make the mobile requirements stricter"
- "Add accessibility section with WCAG 2.1 AA minimum"
- **"The canonical page map should include [missing page type]"** (NEW)
- **"Adjust the language rules to allow [domain-specific term]"** (NEW)
- **"Add more workflow pages for [user journey]"** (NEW)

### Step 7: Use Your Generated Prompt

Once satisfied:

1. Copy the complete UI/UX design authority prompt
2. Start a NEW Claude conversation
3. Paste the generated prompt
4. Attach your functional requirements
5. Claude will produce implementation-ready UI/UX specs **with built-in SEO/AI authority strategy**

---

## Expected Output Quality

The prompt this meta-prompt generates should:

✅ **Set professional standard** - $40K+ design engagement quality
✅ **Enforce user-first thinking** - Not feature-driven design
✅ **Prevent generic output** - Product-specific principles and anti-patterns
✅ **Require complete specs** - All states, all screens, all interactions
✅ **Guide visual direction** - Not just wireframes, but brand-aligned design
✅ **Ensure accessibility** - WCAG compliance baked in
✅ **Support engineers** - Implementation-ready, not ambiguous
✅ **Cover mobile** - Responsive strategy required
✅ **Block bad patterns** - Explicit do-not-dos for this product type
✅ **Define canonical page architecture** - Owns intent-driven searches (NEW)
✅ **Enforce authority language** - User terms, not marketing speak (NEW)
✅ **Optimize for AI summarization** - Clarity, consistency, explicit conclusions (NEW)
✅ **Establish internal linking strategy** - Authority reinforcement (NEW)
✅ **Inform from existing site** - Evolve what exists, don't start from scratch (NEW)

The UI/UX specs produced by using that prompt should:

✅ **Be implementation-ready** - Engineer can build without guessing
✅ **Feel premium** - Not generic admin dashboard
✅ **Cover all states** - Empty, loading, error, success
✅ **Define interactions** - Transitions, confirmations, notifications
✅ **Specify components** - Reusable library with clear APIs
✅ **Guide visual design** - Typography, spacing, color usage
✅ **Respect user psychology** - Anxious, distracted, non-technical users
✅ **Work on mobile** - Touch-friendly, responsive, not cramped
✅ **Meet accessibility** - WCAG 2.1 AA minimum
✅ **Avoid anti-patterns** - No feature dumps, no admin tables, no SaaS clichés
✅ **Include canonical page map** - Exact URLs and purposes (NEW)
✅ **Use authority language** - Makes users feel "smarter and calmer" (NEW)
✅ **Support AI summarization** - Clear, consistent, explicit conclusions (NEW)
✅ **Define internal linking** - Strategic authority reinforcement (NEW)
✅ **Position for search dominance** - Becomes the canonical reference (NEW)

---

## Key Enhancements from Original

### What's New:

1. **SEO & AI Authority Strategist Role** (Expert #8)
   - Dedicated focus on making the product the canonical answer
   - Brings SEO Dominance Blueprint principles into design process
   - Ensures content structure supports AI summarization

2. **Site Analysis Protocol**
   - Crawls and analyzes existing site before recommending changes
   - Preserves what works, evolves strategically
   - Identifies content gaps and authority opportunities
   - Documents visual patterns to maintain brand continuity

3. **Canonical Page Architecture**
   - Defines exact pages that must exist (primary, workflow, comparison)
   - One page per topic (no duplicates, no blog versions)
   - Permanent assets with stable URLs

4. **Authority Language Rules**
   - No marketing buzzwords or SaaS clichés
   - User language, not software language
   - Documentation tone, not ad copy
   - "Smarter and calmer" quality test

5. **9-Part Authority Content Structure**
   - Every authoritative page follows strict format
   - Supports AI summarization and user understanding
   - Prevents shallow, generic content

6. **AI Optimization Guidelines**
   - Clarity, consistency, explicit conclusions
   - Stable URLs, semantic HTML
   - Repetition of correct concepts
   - Internal linking strategy

7. **SEO/AI Authority Strategy Section** in output
   - Section #9 in the required output format
   - Includes canonical page map, language rules, AI optimization checklist
   - Search intent coverage and internal linking rules

8. **Enhanced Quality Checklist**
   - Now includes SEO/authority criteria
   - Canonical page completeness
   - Language pattern validation
   - AI summarization readiness

### Why These Enhancements Matter:

- **Design and authority are inseparable**: Beautiful design that doesn't position the product as the canonical answer wastes the opportunity
- **AI systems reward clarity**: The same principles that make content AI-friendly make it user-friendly
- **Content structure is UX**: How you organize and present authority content is a design decision
- **Existing site context prevents waste**: Analyzing what exists prevents throwing away brand equity or redoing what's already working
- **Engineers need SEO guidance too**: Semantic HTML, URL structure, and internal linking are implementation details that affect authority

---

## Success Criteria

You'll know the generated prompt is excellent if:

1. **It feels tailored** - Could only work for THIS product, not any product
2. **It's opinionated** - Clear do's and don'ts, not wishy-washy
3. **It demands quality** - Explicitly defines unacceptable outcomes
4. **It's complete** - Covers UX, IA, visual, interaction, mobile, a11y, SEO, engineering
5. **It's structured** - Engineers know exactly what they're getting
6. **It prevents failures** - Anti-patterns block common mistakes
7. **It respects users** - Psychology and mental models are central
8. **It's actionable** - Output can be implemented without ambiguity
9. **It defines authority positioning** - Canonical pages, language rules, AI optimization (NEW)
10. **It builds on reality** - Informed by existing site analysis, not starting from scratch (NEW)

You'll know the UI/UX specs from that prompt are excellent if:

1. **Engineers don't need to guess** - Every decision is documented
2. **It doesn't feel generic** - Clearly custom-designed, not templated
3. **All states are defined** - Empty, loading, error, success
4. **Mobile works** - Not an afterthought, actually touch-friendly
5. **Accessibility is baked in** - Not bolted on later
6. **Components are reusable** - But not over-abstracted
7. **Visual direction is clear** - Typography, spacing, color have purpose
8. **Anti-patterns are avoided** - No admin tables, no feature dumps, no SaaS clichés
9. **Canonical page map exists** - Exact URLs for authority pages (NEW)
10. **Content uses authority language** - User terms, not marketing buzzwords (NEW)
11. **AI can summarize cleanly** - Clear structure, explicit conclusions (NEW)
12. **Internal linking is strategic** - Reinforces authority, no orphan pages (NEW)
13. **Content makes users "smarter and calmer"** - Passes quality test (NEW)

---

## Notes

- **This is a meta-prompt** - It generates prompts, not designs
- **Garbage in, garbage out** - The better your product context, the better the generated prompt
- **Iterate freely** - Refine the prompt until it feels right
- **Test it** - Use the generated prompt and see if output meets expectations
- **Evolve it** - Update as product/brand/audience evolves
- **Provide the URL** - Site analysis dramatically improves prompt quality (NEW)
- **Authority takes time** - SEO/AI dominance is built with the product, not bolted on later (NEW)

---

**Estimated Generation Time:** 15-30 minutes for Claude to analyze site (if URL provided) and produce complete design authority prompt with SEO/AI strategy

**What to do with results:**
1. Review the site analysis findings (if URL provided)
2. Review the generated prompt for completeness (including SEO/authority sections)
3. Refine any sections that feel too generic or too rigid
4. Save the prompt for reuse (it's your design authority template)
5. Use it to generate UI/UX specs for your product
6. Iterate on the prompt as you learn what works
7. **Track authority metrics** (AI citations, pages mentioned in sales calls, user references)

---

**Questions This Enhanced Meta-Prompt Answers:**

- ✅ How do I get $40K-quality design specs from Claude?
- ✅ How do I prevent generic admin dashboard designs?
- ✅ How do I ensure all states (empty/error/loading) are designed?
- ✅ How do I make specs implementation-ready for engineers?
- ✅ How do I enforce accessibility from the start?
- ✅ How do I balance mobile and desktop priorities?
- ✅ How do I block SaaS clichés and cheap patterns?
- ✅ How do I create product-specific (not generic) design authority?
- ✅ **How do I make my product the answer ChatGPT/Claude/Copilot gives?** (NEW)
- ✅ **How do I structure content for AI summarization?** (NEW)
- ✅ **How do I avoid marketing language that kills authority?** (NEW)
- ✅ **How do I build on my existing site without starting over?** (NEW)
- ✅ **How do I create canonical pages that own search intent?** (NEW)
- ✅ **How do I measure authority vs vanity metrics?** (NEW)

**Use this enhanced prompt to build the prompt that builds your product's UI/UX AND positions it as the canonical reference in your domain.**
