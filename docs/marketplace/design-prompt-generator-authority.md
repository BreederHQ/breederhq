# Design Prompt Generator: Multi-Role Authority Prompt

> Use this prompt with Claude to generate production-ready UI/UX design authority prompts through collaborative expert debate

---

## The Prompt

```
You are a panel of senior product design and UX strategy experts tasked with creating a comprehensive UI/UX design authority prompt for a software product. Your goal is to produce a prompt that, when used, will generate $40,000+ quality design specifications suitable for direct engineer handoff.

## Context

I need a UI/UX design authority prompt that will guide Claude to produce implementation-ready design specifications. The prompt you create must embody professional design studio standards and prevent common mistakes like generic dashboards, admin-style interfaces, and feature-driven (instead of user-driven) design.

**What I'll Provide:**
- Product name and context
- Target audience and user types
- Existing backend capabilities
- Functional requirements
- Brand expectations
- Any design constraints

**What Your Prompt Must Produce:**
A structured UI/UX specification that an engineer can implement without guessing, including:
- UX strategy
- Information architecture
- Page-level designs
- Component specifications
- Interaction patterns
- Visual design direction
- Anti-patterns to avoid

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

**Critical Questions to Answer:**
- How should content be grouped and prioritized?
- What belongs at the top level vs nested?
- How do we handle complexity without overwhelming users?
- What doesn't belong in this product?
- How do we make every screen "readable at a glance"?

**Provide:**
- Information architecture section requirements
- Navigation structure guidance
- Content grouping principles
- Scoping guidance (what to exclude)

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

**Critical Questions to Answer:**
- How should typography do "most of the work"?
- What makes something feel premium vs generic?
- How do we use color meaningfully, not decoratively?
- What visual restraint principles matter?
- How do we avoid design system bloat?

**Provide:**
- "Visual Design Direction" section requirements
- Typography and spacing strategy guidance
- Color usage philosophy
- Polish vs over-design boundaries

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

**Critical Questions to Answer:**
- What WCAG level should be targeted?
- What accessibility patterns must be specified?
- How do we handle keyboard navigation?
- What color contrast requirements exist?
- How do we ensure screen reader compatibility?

**Provide:**
- Accessibility section requirements
- Inclusive design principles
- WCAG compliance checklist
- Semantic structure guidance

---

### 8. Engineer Handoff Specialist
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

### 9. Anti-Pattern Guardian
**Focus:** Common mistakes, quality degradation, SaaS clichés

**Your Responsibility:**
- Compile anti-patterns specific to the product type
- Define explicit "do-not-do" guidance
- Identify tempting but wrong patterns
- Prevent quality degradation through awareness

**Critical Questions to Answer:**
- What mistakes are common for this product type?
- What SaaS clichés must be avoided?
- What patterns cheapen the experience?
- What is tempting but wrong for this audience?
- How do we enforce "this is not acceptable"?

**Provide:**
- "Anti-Patterns and Explicit Do-Not-Dos" section
- Product-type-specific mistakes to avoid
- Quality degradation triggers
- Enforcement language

---

### 10. Output Format Architect
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

### 2. Complete UI/UX Design Authority Prompt

Structure it EXACTLY as follows:

#### Section A: Role and Authority
Define:
- Professional standard Claude must operate at
- Accountability areas
- What Claude is NOT (junior designer, brainstorming, etc.)
- Backend assumption boundaries

#### Section B: Product Context
Include:
- Product name and URL(s)
- Target audience(s) with expectations
- Brand positioning and tone
- What the product must feel like
- Competitive differentiation

#### Section C: Core Design Principles (Non-Negotiable)
List 5-8 principles that must be followed:
- User-first mental model
- Progressive disclosure
- Readable at a glance
- No empty screens
- Mobile competency
- Visual restraint
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

2. **Information Architecture**
   - Navigation structure
   - Page hierarchy
   - Global vs contextual elements
   - What doesn't belong

3. **Page-Level Design Specifications**
   For each major page:
   - Purpose
   - Primary/secondary actions
   - Layout structure
   - Key components
   - Data grouping logic
   - Empty/error/loading states

4. **Visual Design Direction**
   - Typography strategy
   - Spacing rhythm
   - Color usage rules
   - Component styling philosophy
   - What makes this feel premium

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

7. **Accessibility Requirements**
   - WCAG compliance level
   - Keyboard navigation
   - Screen reader support
   - Color contrast standards
   - Semantic HTML requirements

8. **Mobile & Responsive Strategy**
   - Breakpoint strategy
   - Mobile-specific patterns
   - Touch target sizes
   - What adapts vs hides

9. **Anti-Patterns and Explicit Do-Not-Dos**
   - Common mistakes to avoid
   - Patterns that cheapen experience
   - SaaS clichés to reject
   - Tempting but wrong patterns

10. **Engineer Handoff Notes**
    - Implementation priorities
    - Component reuse strategy
    - Where precision matters
    - Where flexibility is acceptable

#### Section F: Quality Bar Enforcement

Define:
- What Claude should do when uncertain
- Failure conditions (unacceptable outcomes)
- What success looks like
- Professional standard reminder

### 3. Prompt Usage Instructions

Provide:
- Step-by-step how to use the prompt
- What files/context to attach
- What to expect in output
- How to iterate if needed

### 4. Design Considerations Specific to This Product

List:
- Unique design challenges for this product type
- User psychology considerations
- Critical success factors
- Common pitfalls for this domain

### 5. Quality Checklist

Create a checklist to verify the generated design meets:
- [ ] User mental models clearly defined
- [ ] All pages have empty/error/loading states
- [ ] Mobile experience is competent
- [ ] Component reuse is balanced
- [ ] Accessibility is baked in
- [ ] Anti-patterns are called out
- [ ] Engineer handoff is clear
- [ ] [Product-specific criteria]

---

## Panel Collaboration Guidelines

**Debate and Challenge:**
- If you see conflicting priorities between roles, call it out
- Challenge each other on what's truly necessary vs nice-to-have
- Debate section importance and ordering
- Question assumptions about user needs
- Push back on over-specification and under-specification

**Consensus Building:**
- Agree on section structure before proceeding
- Align on quality bar definition
- Establish shared anti-patterns
- Reconcile desktop-first vs mobile-first
- Balance completeness with brevity

**Critical Thinking:**
- Don't assume standard patterns work for this product
- Question whether common sections are needed
- Consider product-specific requirements
- Think about engineer interpretation challenges
- Anticipate ways the prompt could be misused

---

## Analysis Guidelines

- **Be product-specific:** Generic prompts produce generic output
- **Be brutally honest:** Point out conflicts between ideal and practical
- **Think like a skeptic:** How could this prompt fail?
- **Consider the engineer:** Will they understand what to build?
- **Prevent common failures:** Admin dashboards, feature dumps, generic SaaS
- **Enforce quality:** The prompt must demand professional-grade output
- **Balance completeness with focus:** Cover everything, but prioritize ruthlessly

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

❌ **Generic design principles** - Could apply to any product
❌ **Vague quality expectations** - No clear success criteria
❌ **Missing state coverage** - Empty/error/loading states forgotten
❌ **No anti-patterns** - Fails to prevent common mistakes
❌ **Feature-first language** - Not user-first
❌ **Desktop-only bias** - Mobile as afterthought
❌ **Accessibility missing** - Bolted on later
❌ **Ambiguous output** - Engineers must guess

---

## Files and Context I'll Provide

When I use this prompt, I'll give you:

1. **Product Overview**
   - Name, URL(s), purpose
   - Target audience(s)
   - Brand expectations

2. **Functional Requirements** (if available)
   - Features and capabilities
   - User workflows
   - Backend entities

3. **Design Constraints** (if any)
   - Existing brand guidelines
   - Technical limitations
   - Business requirements

4. **Examples or References** (optional)
   - Existing design authority prompts I like
   - Products that inspire the right feel
   - Anti-example (what NOT to be like)

---

Begin your panel collaboration. Debate structure, challenge assumptions, and synthesize into a complete UI/UX design authority prompt tailored to the product context I'll provide.
```

---

## How to Use This Prompt

### Step 1: Prepare Your Context

Gather:
- **Product name and purpose** - What is being built?
- **Target audience** - Who will use it? (technical level, expectations)
- **Brand positioning** - Premium? Simple? Trustworthy? Human?
- **Functional requirements** - What features exist or are planned?
- **Design constraints** - Any limitations or requirements?
- **References** - Examples of prompts you like (e.g., Client Portal prompt)

### Step 2: Start New Claude Conversation

Use a fresh conversation or `/clear` to reset context.

### Step 3: Paste the Prompt Above

Copy the entire prompt from "The Prompt" section.

### Step 4: Provide Your Product Context

After pasting the prompt, provide:

```
## Product Context for UI/UX Design Authority Prompt

**Product Name:** [Your product name]
**URL(s):** [URLs where product lives]

**Target Audience:**
- [User type 1]: [expectations, technical level, psychology]
- [User type 2]: [expectations, technical level, psychology]

**Brand Positioning:**
- Must feel: [polished, premium, trustworthy, etc.]
- Must NOT feel: [generic, admin-like, busy, etc.]
- Inspiration: [products that get the tone right]

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
```

### Step 5: Claude Responds With

You'll receive:

1. **Executive Summary** - Overview of design challenge
2. **Complete UI/UX Design Authority Prompt** - Ready to use
   - Role and Authority section
   - Product Context section
   - Core Design Principles
   - Required Output Format (10 sections)
   - Quality Bar Enforcement
3. **Prompt Usage Instructions** - How to use the generated prompt
4. **Design Considerations** - Product-specific challenges
5. **Quality Checklist** - Verify the design meets standards

### Step 6: Refine If Needed

Review the generated prompt and:
- Check if principles match your product needs
- Verify output format covers everything
- Ensure anti-patterns are product-specific
- Confirm quality bar is high enough

Ask Claude to refine:
- "Add a section about [X]"
- "The anti-patterns should also cover [Y]"
- "Make the mobile requirements stricter"
- "Add accessibility section with WCAG 2.1 AA minimum"

### Step 7: Use Your Generated Prompt

Once satisfied:

1. Copy the complete UI/UX design authority prompt
2. Start a NEW Claude conversation
3. Paste the generated prompt
4. Attach your functional requirements
5. Claude will produce implementation-ready UI/UX specs

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

---

## Meta-Prompt Design Decisions

This prompt uses a **multi-role panel approach** because:

1. **Diverse perspectives** - Design strategy, IA, interaction, visual, component, mobile, a11y, engineering, anti-patterns, output format
2. **Built-in debate** - Roles challenge each other on priorities
3. **Comprehensive coverage** - Each role ensures their domain isn't forgotten
4. **Quality enforcement** - Multiple experts prevent single-perspective bias
5. **Consensus building** - Forces reconciliation of competing priorities

**Panel Roles Explained:**

| Role | Focus | Why Essential |
|------|-------|---------------|
| Design Strategy Lead | Principles, mental models, quality bar | Prevents generic output, sets professional standard |
| Information Architect | Structure, hierarchy, navigation | Prevents information overload, ensures scannability |
| Interaction Design Expert | States, flows, microinteractions | Prevents undefined behaviors, handles edge cases |
| Visual Design Director | Typography, spacing, color, polish | Prevents admin-style aesthetics, enforces premium feel |
| Component Systems Architect | Reusability, consistency, maintainability | Prevents both under-design and over-engineering |
| Mobile & Responsive Strategist | Cross-device, touch, breakpoints | Prevents desktop-only thinking, ensures mobile competency |
| Accessibility & Inclusive Design Advocate | WCAG, keyboard, screen readers | Prevents accessibility as afterthought, ensures compliance |
| Engineer Handoff Specialist | Implementation clarity, feasibility | Prevents ambiguity, ensures specs are buildable |
| Anti-Pattern Guardian | Common mistakes, quality degradation | Explicitly blocks SaaS clichés and cheap patterns |
| Output Format Architect | Structure, completeness, clarity | Ensures nothing gets skipped, output is organized |

**Why This Works:**

- **Debate identifies conflicts** - Desktop-first vs mobile-first, precision vs flexibility
- **Consensus ensures balance** - Complete but not bloated, specific but not rigid
- **Roles enforce coverage** - Can't skip accessibility if a11y advocate is on panel
- **Quality bar is defended** - Anti-pattern guardian blocks mediocrity

---

## Examples of Prompts This Can Generate

This meta-prompt can create design authority prompts for:

### Client-Facing Products
- **Client portals** - Non-technical users, self-service, trust-building
- **Customer dashboards** - Transaction history, support, account management
- **Booking systems** - Calendar UX, confirmation flows, reminders

### Internal Tools
- **Admin dashboards** - Data-heavy, action-oriented, efficiency-focused
- **Content management** - Media handling, bulk operations, workflows
- **Analytics platforms** - Data visualization, filtering, exporting

### Marketplaces
- **Two-sided platforms** - Buyers and sellers, listings, transactions
- **Service marketplaces** - Discovery, booking, reviews, messaging
- **Product marketplaces** - Browse, search, cart, checkout

### SaaS Applications
- **Business tools** - Collaboration, productivity, workflows
- **Vertical SaaS** - Industry-specific (e.g., breeding, construction, healthcare)
- **API platforms** - Developer-focused, documentation, sandbox

Each generated prompt will be **product-specific**, not generic design advice.

---

## Success Criteria

You'll know the generated prompt is excellent if:

1. **It feels tailored** - Could only work for THIS product, not any product
2. **It's opinionated** - Clear do's and don'ts, not wishy-washy
3. **It demands quality** - Explicitly defines unacceptable outcomes
4. **It's complete** - Covers UX, IA, visual, interaction, mobile, a11y, engineering
5. **It's structured** - Engineers know exactly what they're getting
6. **It prevents failures** - Anti-patterns block common mistakes
7. **It respects users** - Psychology and mental models are central
8. **It's actionable** - Output can be implemented without ambiguity

You'll know the UI/UX specs from that prompt are excellent if:

1. **Engineers don't need to guess** - Every decision is documented
2. **It doesn't feel generic** - Clearly custom-designed, not templated
3. **All states are defined** - Empty, loading, error, success
4. **Mobile works** - Not an afterthought, actually touch-friendly
5. **Accessibility is baked in** - Not bolted on later
6. **Components are reusable** - But not over-abstracted
7. **Visual direction is clear** - Typography, spacing, color have purpose
8. **Anti-patterns are avoided** - No admin tables, no feature dumps, no SaaS clichés

---

## Iteration Strategy

If the first generated prompt isn't quite right:

**Ask for adjustments:**
- "Make the quality bar stricter - this needs to feel truly premium"
- "Add more product-specific anti-patterns for [domain]"
- "The mobile section needs to be more prescriptive"
- "Add a section about [unique product challenge]"
- "Tone down the accessibility requirements to WCAG 2.1 A for MVP"

**Request alternatives:**
- "Show me two versions: one desktop-first, one mobile-first"
- "Give me a version optimized for rapid prototyping vs production polish"
- "Create a version focused on data-heavy interfaces"

**Combine prompts:**
- "Merge the Client Portal prompt structure with marketplace-specific sections"
- "Use the quality bar from Prompt A and output format from Prompt B"

---

## Advanced Usage

### For Multi-Product Companies

Generate prompts for each product, then extract:
- **Shared principles** - What's consistent across all products?
- **Product-specific sections** - What's unique to each?
- **Component library overlap** - What can be reused?

### For Design Systems

Use this to generate:
- **Component specification prompts** - For each major component
- **Pattern library prompts** - For interaction patterns
- **Accessibility audit prompts** - For WCAG compliance reviews

### For Agency Work

Generate client-specific prompts that:
- Match client brand guidelines
- Respect client industry standards
- Account for client user base
- Align with client technical stack

---

## Notes

- **This is a meta-prompt** - It generates prompts, not designs
- **Garbage in, garbage out** - The better your product context, the better the generated prompt
- **Iterate freely** - Refine the prompt until it feels right
- **Test it** - Use the generated prompt and see if output meets expectations
- **Evolve it** - Update as product/brand/audience evolves

---

**Estimated Generation Time:** 10-20 minutes for Claude to produce complete design authority prompt

**What to do with results:**
1. Review the generated prompt for completeness
2. Refine any sections that feel too generic or too rigid
3. Save the prompt for reuse (it's your design authority template)
4. Use it to generate UI/UX specs for your product
5. Iterate on the prompt as you learn what works

---

**Questions This Meta-Prompt Answers:**

- ✅ How do I get $40K-quality design specs from Claude?
- ✅ How do I prevent generic admin dashboard designs?
- ✅ How do I ensure all states (empty/error/loading) are designed?
- ✅ How do I make specs implementation-ready for engineers?
- ✅ How do I enforce accessibility from the start?
- ✅ How do I balance mobile and desktop priorities?
- ✅ How do I block SaaS clichés and cheap patterns?
- ✅ How do I create product-specific (not generic) design authority?

**Use this prompt to build the prompt that builds your product's UI/UX.**
