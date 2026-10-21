import { DatabaseSchema } from './types.ts';

export function getSeedData(_relativeDates: boolean = true): DatabaseSchema {
  return getInitialSeedData();
}

export function getInitialSeedData(): DatabaseSchema {
  const now = Date.now();
  const DAY_MS = 86400000;
  const daysFromNow = (days: number, timeStr = '23:59:00.000Z') => {
    const d = new Date(now + days * DAY_MS);
    const dateStr = d.toISOString().split('T')[0];
    return `${dateStr}T${timeStr}`;
  };

  return {
    users: [
      {
        id: 1,
        email: 'sara.ahmed@campus.edu',
        password: 'password123',
        name: 'Sara Ahmed',
        major: 'Computer Science',
        semester: 3,
        bio: 'Passionate frontend developer specializing in responsive modern React interfaces and accessible design systems.',
        skills: ['React', 'UI Design', 'TypeScript', 'Tailwind CSS']
      },
      {
        id: 2,
        email: 'ali.khan@campus.edu',
        password: 'password123',
        name: 'Ali Khan',
        major: 'Software Engineering',
        semester: 4,
        bio: 'Backend architecture enthusiast. Experienced in Node.js, Express, Python REST APIs, and database optimization.',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'Express', 'API Design']
      },
      {
        id: 3,
        email: 'maya.chen@campus.edu',
        password: 'password123',
        name: 'Maya Chen',
        major: 'Graphic Design',
        semester: 5,
        bio: 'Visual and brand designer. Love crafting modern vector illustrations, club identities, and UI mockups in Figma.',
        skills: ['Figma', 'Illustrator', 'Branding', 'Logo Design']
      },
      {
        id: 4,
        email: 'liam.oconnor@campus.edu',
        password: 'password123',
        name: 'Liam O\'Connor',
        major: 'English Literature',
        semester: 6,
        bio: 'Senior writing fellow and academic editor. Helping peers polish research papers, thesis proposals, and statements of purpose.',
        skills: ['Academic Writing', 'Proofreading', 'Essays', 'MLA/APA Style']
      },
      {
        id: 5,
        email: 'priya.patel@campus.edu',
        password: 'password123',
        name: 'Priya Patel',
        major: 'Mathematics & CS',
        semester: 2,
        bio: 'Peer tutor passionate about breaking down complex math concepts: linear algebra, multivariable calculus, and proofs.',
        skills: ['Calculus', 'Linear Algebra', 'Python', 'Discrete Math']
      },
      {
        id: 6,
        email: 'david.kim@campus.edu',
        password: 'password123',
        name: 'David Kim',
        major: 'Interaction Design',
        semester: 4,
        bio: 'UX researcher and interactive prototype builder. Focused on usability testing and intuitive user flows.',
        skills: ['Figma', 'Wireframing', 'User Testing', 'CSS Animation']
      },
      {
        id: 7,
        email: 'fatima.almansoor@campus.edu',
        password: 'password123',
        name: 'Fatima Al-Mansoor',
        major: 'Data Science',
        semester: 5,
        bio: 'Data science student focused on predictive modeling, exploratory data analysis, and scientific Python.',
        skills: ['Python', 'Pandas', 'Machine Learning', 'Statistics']
      },
      {
        id: 8,
        email: 'marcus.vance@campus.edu',
        password: 'password123',
        name: 'Marcus Vance',
        major: 'Business Administration',
        semester: 3,
        bio: 'Pitch deck designer and campus venture strategist. Skilled in market research and pitch deck storytelling.',
        skills: ['PowerPoint', 'Market Research', 'Pitch Decks', 'Public Speaking']
      },
      {
        id: 9,
        email: 'elena.rostova@campus.edu',
        password: 'password123',
        name: 'Elena Rostova',
        major: 'Computer Engineering',
        semester: 7,
        bio: 'Hardware-software codesign and low-level systems programmer. Building robotics prototypes and Arduino controllers.',
        skills: ['C++', 'Rust', 'Arduino', 'Computer Architecture']
      },
      {
        id: 10,
        email: 'carlos.mendez@campus.edu',
        password: 'password123',
        name: 'Carlos Mendez',
        major: 'Media Arts',
        semester: 4,
        bio: 'Videographer and motion designer. Creating student documentary reels, short trailers, and social video content.',
        skills: ['Premiere Pro', 'After Effects', 'Sound Design', 'Storyboarding']
      },
      {
        id: 11,
        email: 'aisha.bello@campus.edu',
        password: 'password123',
        name: 'Aisha Bello',
        major: 'Biology & Pre-Med',
        semester: 6,
        bio: 'Biochemistry peer mentor and lab report guide. Helping premed students ace organic chemistry reaction mechanisms.',
        skills: ['Organic Chemistry', 'Biology', 'Lab Reports', 'MCAT Prep']
      },
      {
        id: 12,
        email: 'noah.tanaka@campus.edu',
        password: 'password123',
        name: 'Noah Tanaka',
        major: 'Web Development',
        semester: 3,
        bio: 'Full-stack builder passionate about open source and student hackathons. Always excited to collaborate on new ideas.',
        skills: ['React', 'Vue', 'Next.js', 'REST APIs']
      },
      {
        id: 13,
        email: 'evaluator.owner@campus.edu',
        password: 'Evaluator2026!',
        name: 'Alex Morgan',
        major: 'Computer Science',
        semester: 4,
        bio: 'Evaluator Testing Account: Specializes in posting gigs, reviewing proposals, and applicant management.',
        skills: ['React', 'Node.js', 'System Architecture']
      },
      {
        id: 14,
        email: 'evaluator.applicant@campus.edu',
        password: 'Evaluator2026!',
        name: 'Jordan Taylor',
        major: 'Software Engineering',
        semester: 3,
        bio: 'Evaluator Testing Account: Specializes in browsing marketplace gigs, submitting proposals, and mutual peer reviews.',
        skills: ['Python', 'Figma', 'Technical Writing']
      }
    ],

    // Gigs: exactly 25 gigs
    // Suggested categories: Programming 8, Design 6, Writing 6, Tutoring 5
    // Suggested statuses: Open 12, In Progress 5, Completed 5, Expired 2, Cancelled 1
    // Mix of Offering and Requesting, Paid, SkillSwap, Free
    gigs: [
      // 1. Programming - Open (Offering) - Paid
      {
        id: 101,
        user_id: 1, // Sara Ahmed
        title: 'React & Tailwind Component Library Setup',
        description: 'Offering 4 hours of hands-on pairing to build clean, reusable React component systems with Tailwind styling for your project.',
        type: 'Offering',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 1200,
        deadline: daysFromNow(25),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-3)
      },
      // 2. Programming - Open (Requesting) - Paid
      {
        id: 102,
        user_id: 8, // Marcus Vance
        title: 'Build Python Web Scraper for Market Analysis',
        description: 'Need an experienced programmer to build a script extracting local competitor pricing from public business directories into CSV.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 2500,
        deadline: daysFromNow(20),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-2)
      },
      // 3. Programming - Open (Requesting) - SkillSwap
      {
        id: 103,
        user_id: 3, // Maya Chen
        title: 'Debug Express API Authentication Routes',
        description: 'Looking for a backend developer to troubleshoot JWT middleware and route guards. Will exchange 2 custom vector logos in return.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(30),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-2)
      },
      // 4. Programming - Open (Offering) - Free
      {
        id: 104,
        user_id: 12, // Noah Tanaka
        title: 'Code Review & Git Workflow Mentoring',
        description: 'Offering free 45-minute code reviews for beginner CS students. We can review pull requests, clean up commit trees, or debug logic.',
        type: 'Offering',
        category: 'Programming',
        payment_type: 'Free',
        budget: null,
        deadline: daysFromNow(35),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-1)
      },
      // 5. Programming - In Progress (Requesting) - Paid (accepted_applicant_id: 201)
      {
        id: 105,
        user_id: 4, // Liam
        title: 'Full-Stack Student Literary Journal Website',
        description: 'Need a multi-page web platform for our campus literary magazine with article submission forms and reader archive.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 3500,
        deadline: daysFromNow(28),
        status: 'In Progress',
        accepted_applicant_id: 201, // references Applications.id
        created_at: daysFromNow(-5)
      },
      // 6. Programming - Completed (Requesting) - Paid (accepted_applicant_id: 202)
      {
        id: 106,
        user_id: 7, // Fatima
        title: 'Interactive Data Dashboard in React and Chart.js',
        description: 'Build interactive line and bar charts with filter widgets for student survey results. Needs responsive mobile layouts.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 2800,
        deadline: daysFromNow(-2),
        status: 'Completed',
        accepted_applicant_id: 202,
        created_at: daysFromNow(-11)
      },
      // 7. Programming - Expired (Requesting) - Paid
      {
        id: 107,
        user_id: 5, // Priya
        title: 'Automated Homework Grader CLI Tool',
        description: 'Create a Python script to test student code submissions against test cases and produce markdown reports.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 1500,
        deadline: daysFromNow(-6),
        status: 'Expired',
        accepted_applicant_id: null,
        created_at: daysFromNow(-16)
      },
      // 8. Programming - Cancelled (Offering) - SkillSwap
      {
        id: 108,
        user_id: 9, // Elena
        title: 'Raspberry Pi Home Automation Workshop',
        description: 'Offering hands-on setup of IoT temperature sensors and MQTT brokers in exchange for assistance with 3D CAD modeling.',
        type: 'Offering',
        category: 'Programming',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(11),
        status: 'Cancelled',
        accepted_applicant_id: null,
        created_at: daysFromNow(-9)
      },

      // 9. Design - Open (Offering) - Paid
      {
        id: 109,
        user_id: 3, // Maya Chen
        title: 'Club & Student Startup Branding Package',
        description: 'Offering a complete branding identity including primary vector logo, color palette, typography guidelines, and social media banners.',
        type: 'Offering',
        category: 'Design',
        payment_type: 'Paid',
        budget: 2000,
        deadline: daysFromNow(32),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-2)
      },
      // 10. Design - Open (Requesting) - Paid
      {
        id: 110,
        user_id: 2, // Ali Khan
        title: 'UI/UX Mockups for Campus Transit App',
        description: 'Seeking a talented designer to create 6 high-fidelity mobile screens in Figma for real-time bus tracking and route alerts.',
        type: 'Requesting',
        category: 'Design',
        payment_type: 'Paid',
        budget: 1800,
        deadline: daysFromNow(22),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-3)
      },
      // 11. Design - Open (Requesting) - SkillSwap
      {
        id: 111,
        user_id: 11, // Aisha Bello
        title: 'Infographic Posters for Campus Health Week',
        description: 'Need 3 eye-catching visual summary infographics on sleep hygiene and mental wellness. Will trade 3 hours of bio/chem tutoring.',
        type: 'Requesting',
        category: 'Design',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(27),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-2)
      },
      // 12. Design - In Progress (Offering) - Paid (accepted_applicant_id: 205)
      {
        id: 112,
        user_id: 6, // David Kim
        title: 'Figma Usability Review & Design Critique',
        description: 'Providing comprehensive UX audit of your web app or portfolio prototype with annotated wireframes and recommendations.',
        type: 'Offering',
        category: 'Design',
        payment_type: 'Paid',
        budget: 900,
        deadline: daysFromNow(24),
        status: 'In Progress',
        accepted_applicant_id: 205,
        created_at: daysFromNow(-6)
      },
      // 13. Design - Completed (Requesting) - SkillSwap (accepted_applicant_id: 207)
      {
        id: 113,
        user_id: 1, // Sara Ahmed
        title: 'Modern Portfolio Logo and Vector Monogram',
        description: 'Looking for a minimalist typographic logo for my engineering portfolio. Exchanging custom responsive CSS and Tailwind theme setup.',
        type: 'Requesting',
        category: 'Design',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(-3),
        status: 'Completed',
        accepted_applicant_id: 207,
        created_at: daysFromNow(-13)
      },
      // 14. Design - Expired (Offering) - Free
      {
        id: 114,
        user_id: 10, // Carlos Mendez
        title: 'Free Photo Touch-ups for Student LinkedIn Avatars',
        description: 'Offering quick background cleaning and color balancing for student profile pictures before the fall career fair.',
        type: 'Offering',
        category: 'Design',
        payment_type: 'Free',
        budget: null,
        deadline: daysFromNow(-7),
        status: 'Expired',
        accepted_applicant_id: null,
        created_at: daysFromNow(-15)
      },

      // 15. Writing - Open (Offering) - Paid
      {
        id: 115,
        user_id: 4, // Liam O'Connor
        title: 'Grad School Statement of Purpose Editing',
        description: 'Meticulous sentence-by-sentence editing, clarity enhancement, and structural feedback for graduate school admissions essays.',
        type: 'Offering',
        category: 'Writing',
        payment_type: 'Paid',
        budget: 1600,
        deadline: daysFromNow(40),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-4)
      },
      // 16. Writing - Open (Requesting) - Paid
      {
        id: 116,
        user_id: 7, // Fatima
        title: 'Proofreading for IEEE Conference Paper',
        description: 'Looking for a native English editor to polish grammar, academic flow, and passive voice in our 8-page machine learning paper.',
        type: 'Requesting',
        category: 'Writing',
        payment_type: 'Paid',
        budget: 2200,
        deadline: daysFromNow(29),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-1)
      },
      // 17. Writing - Open (Offering) - SkillSwap
      {
        id: 117,
        user_id: 8, // Marcus
        title: 'Executive Summary and Grant Proposal Writing',
        description: 'Offering help drafting executive summaries and student pitch competitions. Will trade for video editing or motion graphics.',
        type: 'Offering',
        category: 'Writing',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(34),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-3)
      },
      // 18. Writing - In Progress (Requesting) - Paid (accepted_applicant_id: 210)
      {
        id: 118,
        user_id: 9, // Elena
        title: 'Technical Documentation for Embedded Sensor SDK',
        description: 'Need help formatting and polishing our open-source robotics C++ API documentation with clear Quickstart examples.',
        type: 'Requesting',
        category: 'Writing',
        payment_type: 'Paid',
        budget: 1400,
        deadline: daysFromNow(26),
        status: 'In Progress',
        accepted_applicant_id: 210,
        created_at: daysFromNow(-7)
      },
      // 19. Writing - Completed (Offering) - Paid (accepted_applicant_id: 212)
      {
        id: 119,
        user_id: 4, // Liam
        title: 'Comprehensive Literature Review Structuring',
        description: 'Guided assistance structuring academic synthesis, citation bibliographies, and thematic literature matrices.',
        type: 'Offering',
        category: 'Writing',
        payment_type: 'Paid',
        budget: 1500,
        deadline: daysFromNow(-4),
        status: 'Completed',
        accepted_applicant_id: 212,
        created_at: daysFromNow(-14)
      },
      // 20. Writing - Open (Offering) - Free
      {
        id: 120,
        user_id: 1, // Sara Ahmed
        title: 'Resume & Cover Letter Peer Review for Tech Internships',
        description: 'Voluntary critique of SWE/design resumes with actionable feedback on impact metrics, ATS formatting, and bullet verbs.',
        type: 'Offering',
        category: 'Writing',
        payment_type: 'Free',
        budget: null,
        deadline: daysFromNow(38),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-1)
      },

      // 21. Tutoring - Open (Offering) - Paid
      {
        id: 121,
        user_id: 5, // Priya Patel
        title: 'Multivariable Calculus & Linear Algebra Tutoring',
        description: 'One-on-one exam preparation focusing on eigenvalue problems, double integrals, and vector fields with step-by-step problem sets.',
        type: 'Offering',
        category: 'Tutoring',
        payment_type: 'Paid',
        budget: 1000,
        deadline: daysFromNow(36),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-2)
      },
      // 22. Tutoring - Open (Requesting) - Paid
      {
        id: 122,
        user_id: 10, // Carlos Mendez
        title: 'Need 1-on-1 Help with Statistics and Probability',
        description: 'Struggling with normal distribution models and hypothesis testing. Looking for 3 sessions before midterm next week.',
        type: 'Requesting',
        category: 'Tutoring',
        payment_type: 'Paid',
        budget: 1500,
        deadline: daysFromNow(18),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-1)
      },
      // 23. Tutoring - Open (Offering) - SkillSwap
      {
        id: 123,
        user_id: 11, // Aisha Bello
        title: 'Organic Chemistry Reactions & Synthesis Tutoring',
        description: 'Offering mechanism breakdown sessions (SN1/SN2/E1/E2 & carbonyl chemistry). Will swap for React website debugging assistance.',
        type: 'Offering',
        category: 'Tutoring',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: daysFromNow(31),
        status: 'Open',
        accepted_applicant_id: null,
        created_at: daysFromNow(-4)
      },
      // 24. Tutoring - In Progress (Offering) - Paid (accepted_applicant_id: 216)
      {
        id: 124,
        user_id: 2, // Ali Khan
        title: 'Data Structures & Algorithms in Python Tutoring',
        description: 'Crash course on graph traversals, binary search trees, and dynamic programming for technical interview rounds.',
        type: 'Offering',
        category: 'Tutoring',
        payment_type: 'Paid',
        budget: 1800,
        deadline: daysFromNow(25),
        status: 'In Progress',
        accepted_applicant_id: 216,
        created_at: daysFromNow(-8)
      },
      // 25. Tutoring - Completed (Offering) - Paid (accepted_applicant_id: 218)
      {
        id: 125,
        user_id: 5, // Priya Patel
        title: 'Discrete Math & Proof Writing Boot Camp',
        description: 'Targeted preparation for induction proofs, set theory, and recurrence relations with custom practice questions.',
        type: 'Offering',
        category: 'Tutoring',
        payment_type: 'Paid',
        budget: 1200,
        deadline: daysFromNow(-5),
        status: 'Completed',
        accepted_applicant_id: 218,
        created_at: daysFromNow(-15)
      }
    ],

    // Applications: 25 applications across the gigs
    applications: [
      // Gig 101 (Open, Sara Ahmed)
      {
        id: 200,
        gig_id: 101,
        applicant_id: 2, // Ali Khan
        message: 'I have a project needing clean React components and would love to collaborate on standardizing our design tokens.',
        status: 'Pending',
        created_at: daysFromNow(-2)
      },
      {
        id: 2010,
        gig_id: 101,
        applicant_id: 6, // David Kim
        message: 'Excited to pair with you! I can provide the design specs while you help set up the React component scaffolding.',
        status: 'Pending',
        created_at: daysFromNow(-2)
      },
      // Gig 102 (Open, Marcus Vance)
      {
        id: 2011,
        gig_id: 102,
        applicant_id: 2, // Ali Khan
        message: 'I specialize in Python Beautiful Soup and Playwright scraping with automated CSV export pipelines.',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 103 (Open, Maya Chen)
      {
        id: 2012,
        gig_id: 103,
        applicant_id: 12, // Noah Tanaka
        message: 'I have built multiple JWT auth middleware services in Express. Let us swap skills; I would love a custom logo!',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 105 (In Progress, Liam O'Connor -> Accepted applicant Ali Khan (app 201))
      {
        id: 201,
        gig_id: 105,
        applicant_id: 2, // Ali Khan
        message: 'I have extensive experience building full-stack platforms with Express and Postgres. I can build the literary journal.',
        status: 'Accepted',
        created_at: daysFromNow(-4)
      },
      {
        id: 2013,
        gig_id: 105,
        applicant_id: 12, // Noah Tanaka
        message: 'I can help build the frontend submission portal using Next.js and Markdown rendering.',
        status: 'Rejected', // Rejected because 201 was accepted
        created_at: daysFromNow(-4)
      },
      // Gig 106 (Completed, Fatima Al-Mansoor -> Accepted applicant Sara Ahmed (app 202))
      {
        id: 202,
        gig_id: 106,
        applicant_id: 1, // Sara Ahmed
        message: 'I build interactive dashboards with React and Chart.js regularly. Let me craft this survey visualization for you.',
        status: 'Accepted',
        created_at: daysFromNow(-10)
      },
      {
        id: 203,
        gig_id: 106,
        applicant_id: 6, // David Kim
        message: 'I have done data visualization dashboards before and can ensure responsive chart layouts.',
        status: 'Rejected',
        created_at: daysFromNow(-10)
      },
      // Gig 109 (Open, Maya Chen)
      {
        id: 204,
        gig_id: 109,
        applicant_id: 8, // Marcus
        message: 'Our student business club needs an updated branding suite and logo for upcoming venture competitions.',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 110 (Open, Ali Khan)
      {
        id: 2014,
        gig_id: 110,
        applicant_id: 3, // Maya Chen
        message: 'Transit UI is one of my favorite design challenges! I can provide clean Figma vector frames and interactive flows.',
        status: 'Pending',
        created_at: daysFromNow(-2)
      },
      {
        id: 2015,
        gig_id: 110,
        applicant_id: 6, // David Kim
        message: 'I have researched campus navigation UX and can deliver wireframes optimized for fast bus schedule lookups.',
        status: 'Pending',
        created_at: daysFromNow(-2)
      },
      // Gig 112 (In Progress, David Kim -> Accepted applicant Maya Chen (app 205))
      {
        id: 205,
        gig_id: 112,
        applicant_id: 3, // Maya Chen
        message: 'I need a thorough UX audit on my client design portfolio prototype before user testing sessions.',
        status: 'Accepted',
        created_at: daysFromNow(-5)
      },
      {
        id: 206,
        gig_id: 112,
        applicant_id: 1, // Sara Ahmed
        message: 'Looking for expert design critique on my component library documentation hierarchy.',
        status: 'Rejected',
        created_at: daysFromNow(-5)
      },
      // Gig 113 (Completed, Sara Ahmed -> Accepted applicant Maya Chen (app 207))
      {
        id: 207,
        gig_id: 113,
        applicant_id: 3, // Maya Chen
        message: 'I would love to design your portfolio monogram and vector mark in exchange for Tailwind setup assistance!',
        status: 'Accepted',
        created_at: daysFromNow(-12)
      },
      {
        id: 208,
        gig_id: 113,
        applicant_id: 6, // David Kim
        message: 'I can create modern typographic logo variations in Figma for your portfolio header.',
        status: 'Rejected',
        created_at: daysFromNow(-12)
      },
      // Gig 115 (Open, Liam)
      {
        id: 209,
        gig_id: 115,
        applicant_id: 11, // Aisha Bello
        message: 'Applying for clinical research master programs and need help tightening my personal narrative statement.',
        status: 'Pending',
        created_at: daysFromNow(-3)
      },
      // Gig 116 (Open, Fatima)
      {
        id: 2016,
        gig_id: 116,
        applicant_id: 4, // Liam
        message: 'I regularly edit technical and CS manuscripts to conform with IEEE formatting standards and style manuals.',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 118 (In Progress, Elena -> Accepted applicant Liam (app 210))
      {
        id: 210,
        gig_id: 118,
        applicant_id: 4, // Liam O'Connor
        message: 'I have experience editing technical markdown manuals and creating developer onboarding guides.',
        status: 'Accepted',
        created_at: daysFromNow(-6)
      },
      {
        id: 211,
        gig_id: 118,
        applicant_id: 1, // Sara Ahmed
        message: 'I can help proofread API reference docs and write clear code snippets.',
        status: 'Rejected',
        created_at: daysFromNow(-6)
      },
      // Gig 119 (Completed, Liam -> Accepted applicant Elena (app 212))
      {
        id: 212,
        gig_id: 119,
        applicant_id: 9, // Elena Rostova
        message: 'Need help organizing literature on embedded sensor networks and hardware acceleration for my senior thesis.',
        status: 'Accepted',
        created_at: daysFromNow(-13)
      },
      // Gig 121 (Open, Priya Patel)
      {
        id: 213,
        gig_id: 121,
        applicant_id: 1, // Sara Ahmed
        message: 'Need help clarifying linear transformation matrices and eigenvalues before our 3D graphics homework deadline!',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 122 (Open, Carlos Mendez)
      {
        id: 214,
        gig_id: 122,
        applicant_id: 7, // Fatima Al-Mansoor
        message: 'I teach statistics and probability distributions weekly and can walk through homework problems step-by-step.',
        status: 'Pending',
        created_at: daysFromNow(-1)
      },
      // Gig 123 (Open, Aisha Bello)
      {
        id: 215,
        gig_id: 123,
        applicant_id: 12, // Noah Tanaka
        message: 'I need review on alkene addition reactions and will happily build or debug your React project!',
        status: 'Pending',
        created_at: daysFromNow(-3)
      },
      // Gig 124 (In Progress, Ali Khan -> Accepted applicant Carlos Mendez (app 216))
      {
        id: 216,
        gig_id: 124,
        applicant_id: 10, // Carlos Mendez
        message: 'I need to master binary search trees and recursion in Python for my media computing project.',
        status: 'Accepted',
        created_at: daysFromNow(-7)
      },
      {
        id: 217,
        gig_id: 124,
        applicant_id: 8, // Marcus Vance
        message: 'Looking for a programming fundamentals refresher on algorithm complexity.',
        status: 'Rejected',
        created_at: daysFromNow(-7)
      },
      // Gig 125 (Completed, Priya Patel -> Accepted applicant David Kim (app 218))
      {
        id: 218,
        gig_id: 125,
        applicant_id: 6, // David Kim
        message: 'Need tutoring on mathematical induction and recurrence relations for my discrete structures course.',
        status: 'Accepted',
        created_at: daysFromNow(-14)
      }
    ],

    // Reviews: 10 mutual reviews referencing completed gigs
    // Gig 106 (Completed): owner Fatima (7), accepted Sara (1) [via app 202]
    // Gig 113 (Completed): owner Sara (1), accepted Maya (3) [via app 207]
    // Gig 119 (Completed): owner Liam (4), accepted Elena (9) [via app 212]
    // Gig 125 (Completed): owner Priya (5), accepted David (6) [via app 218]
    reviews: [
      // Gig 106 mutual reviews
      {
        id: 301,
        gig_id: 106,
        reviewer_id: 7, // Fatima -> Sara
        reviewee_id: 1,
        rating: 5,
        comment: 'Sara built a stellar interactive chart dashboard! Delivered ahead of schedule with clean, accessible components.'
      },
      {
        id: 302,
        gig_id: 106,
        reviewer_id: 1, // Sara -> Fatima
        reviewee_id: 7,
        rating: 5,
        comment: 'Fatima provided clear dataset specifications and was fantastic to collaborate with throughout the project!'
      },
      // Gig 113 mutual reviews
      {
        id: 303,
        gig_id: 113,
        reviewer_id: 1, // Sara -> Maya
        reviewee_id: 3,
        rating: 5,
        comment: 'Maya designed an exquisite monogram and vector logo for my portfolio. Unbelievable eye for detail and aesthetics.'
      },
      {
        id: 304,
        gig_id: 113,
        reviewer_id: 3, // Maya -> Sara
        reviewee_id: 1,
        rating: 5,
        comment: 'Super smooth skill swap! Sara set up all my Tailwind configurations and answered all my questions patiently.'
      },
      // Gig 119 mutual reviews
      {
        id: 305,
        gig_id: 119,
        reviewer_id: 4, // Liam -> Elena
        reviewee_id: 9,
        rating: 4,
        comment: 'Elena had very detailed technical questions and a well-formulated thesis outline. Great academic collaboration.'
      },
      {
        id: 306,
        gig_id: 119,
        reviewer_id: 9, // Elena -> Liam
        reviewee_id: 4,
        rating: 5,
        comment: 'Liam restructured my literature review brilliantly. My advisor was extremely impressed with the clarity of the draft.'
      },
      // Gig 125 mutual reviews
      {
        id: 307,
        gig_id: 125,
        reviewer_id: 5, // Priya -> David
        reviewee_id: 6,
        rating: 5,
        comment: 'David was eager to learn and grasped induction proof mechanics rapidly during our practice sessions.'
      },
      {
        id: 308,
        gig_id: 125,
        reviewer_id: 6, // David -> Priya
        reviewee_id: 5,
        rating: 5,
        comment: 'Priya is the best math tutor on campus! She turned daunting discrete math proofs into intuitive, easy-to-follow steps.'
      },
      // Additional reviews to enrich ratings
      {
        id: 309,
        gig_id: 106,
        reviewer_id: 7,
        reviewee_id: 2, // Fatima previously worked with Ali
        rating: 4,
        comment: 'Reliable work on our data pipeline backend.'
      },
      {
        id: 310,
        gig_id: 113,
        reviewer_id: 3,
        reviewee_id: 4, // Maya previously worked with Liam
        rating: 5,
        comment: 'Helped proofread our design exhibition catalog. Clear and thorough.'
      }
    ],

    saved_gigs: [
      {
        id: 501,
        user_id: 1, // Sara saved Gig 105
        gig_id: 105,
        created_at: daysFromNow(-3)
      },
      {
        id: 502,
        user_id: 2, // Ali saved Gig 101
        gig_id: 101,
        created_at: daysFromNow(-2)
      }
    ],

    notifications: [
      {
        id: 601,
        user_id: 1, // Sara Ahmed
        type: 'application_received',
        title: 'New proposal received',
        message: 'Ali Khan submitted an application for "React & Tailwind Component Library Setup".',
        gig_id: 101,
        link: '/gigs/101',
        read: false,
        created_at: daysFromNow(-3)
      },
      {
        id: 602,
        user_id: 1, // Sara Ahmed
        type: 'review_received',
        title: 'New collaboration review',
        message: 'Fatima Al-Mansoor left a 5-star review for "Interactive Data Dashboard".',
        gig_id: 106,
        link: '/profile/1',
        read: true,
        created_at: daysFromNow(-2)
      },
      {
        id: 603,
        user_id: 2, // Ali Khan
        type: 'application_accepted',
        title: 'Application accepted!',
        message: 'Liam O\'Connor accepted your proposal for "Student Literary Journal Website".',
        gig_id: 105,
        link: '/gigs/105',
        read: false,
        created_at: daysFromNow(-5)
      }
    ]
  };
}
