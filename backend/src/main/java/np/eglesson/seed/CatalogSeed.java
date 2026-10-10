package np.eglesson.seed;

import java.util.List;

/**
 * Starting catalog for Nepal: school, SEE, +2 (NEB), engineering (IOE), medical (IOM), management, IT, entrance
 * preparation and Loksewa. Everything here is editable from the admin portal afterwards.
 */
final class CatalogSeed {
  private CatalogSeed() {}

  record N(String type, String name, String shortName, String icon, String color, String description, boolean featured, List<N> children) {
    static N of(String type, String name, List<N> children) {
      return new N(type, name, null, null, null, null, false, children);
    }
  }

  static N stream(String name, String icon, String color, String description, List<N> children) {
    return new N("STREAM", name, null, icon, color, description, true, children);
  }

  static List<N> subjects(String... names) {
    return java.util.Arrays.stream(names).map(n -> new N("SUBJECT", n, null, null, null, null, false, List.of())).toList();
  }

  static N node(String type, String name, String shortName, List<N> children) {
    return new N(type, name, shortName, null, null, null, false, children);
  }

  static N featured(String type, String name, String shortName, String icon, List<N> children) {
    return new N(type, name, shortName, icon, null, null, true, children);
  }

  static final String[] ROMAN = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII"};

  static List<N> tree() {
    List<N> beComputer = List.of(
        node("SEMESTER", "Semester I", "Sem I", subjects("Engineering Mathematics I", "Computer Programming (C)", "Engineering Drawing I", "Engineering Physics", "Applied Mechanics", "Basic Electrical Engineering")),
        node("SEMESTER", "Semester II", "Sem II", subjects("Engineering Mathematics II", "Engineering Drawing II", "Basic Electronics Engineering", "Engineering Chemistry", "Thermodynamics & Heat Transfer", "Workshop Technology")),
        node("SEMESTER", "Semester III", "Sem III", subjects("Engineering Mathematics III", "Object Oriented Programming", "Electric Circuit Theory", "Theory of Computation", "Electronic Devices and Circuits", "Digital Logic", "Electromagnetism")),
        node("SEMESTER", "Semester IV", "Sem IV", subjects("Electrical Machine", "Numerical Methods", "Applied Mathematics", "Instrumentation I", "Data Structure and Algorithm", "Microprocessor", "Discrete Structure")),
        node("SEMESTER", "Semester V", "Sem V", subjects("Communication English", "Probability and Statistics", "Software Engineering", "Data Communication", "Computer Organization and Architecture", "Instrumentation II", "Computer Graphics")),
        node("SEMESTER", "Semester VI", "Sem VI", subjects("Engineering Economics", "Object Oriented Analysis and Design", "Artificial Intelligence", "Operating System", "Embedded System", "Database Management System")),
        node("SEMESTER", "Semester VII", "Sem VII", subjects("ICT Project Management", "Organization and Management", "Energy, Environment and Society", "Distributed System", "Computer Networks and Security", "Digital Signal Analysis and Processing")),
        node("SEMESTER", "Semester VIII", "Sem VIII", subjects("Engineering Professional Practice", "Information Systems", "Internet and Intranet", "Simulation and Modelling")));

    List<N> beCivil = new java.util.ArrayList<>();
    beCivil.add(node("SEMESTER", "Semester I", "Sem I", subjects("Engineering Mathematics I", "Computer Programming", "Engineering Drawing I", "Engineering Chemistry", "Fundamental of Thermodynamics", "Workshop Technology")));
    beCivil.add(node("SEMESTER", "Semester II", "Sem II", subjects("Engineering Mathematics II", "Engineering Drawing II", "Engineering Physics", "Applied Mechanics", "Basic Electrical Engineering")));
    for (int i = 2; i < 8; i++) beCivil.add(node("SEMESTER", "Semester " + ROMAN[i], "Sem " + ROMAN[i], List.of()));

    List<N> csit = new java.util.ArrayList<>();
    csit.add(node("SEMESTER", "Semester I", "Sem I", subjects("Introduction to Information Technology", "C Programming", "Digital Logic", "Mathematics I (Calculus)", "Physics")));
    csit.add(node("SEMESTER", "Semester II", "Sem II", subjects("Discrete Structure", "Object Oriented Programming", "Microprocessor", "Mathematics II", "Statistics I")));
    csit.add(node("SEMESTER", "Semester III", "Sem III", subjects("Data Structure and Algorithms", "Numerical Method", "Computer Architecture", "Computer Graphics", "Statistics II")));
    for (int i = 3; i < 8; i++) csit.add(node("SEMESTER", "Semester " + ROMAN[i], "Sem " + ROMAN[i], List.of()));

    List<N> bca = new java.util.ArrayList<>();
    for (int i = 0; i < 8; i++) bca.add(node("SEMESTER", "Semester " + ROMAN[i], "Sem " + ROMAN[i], List.of()));
    List<N> bba = new java.util.ArrayList<>();
    for (int i = 0; i < 8; i++) bba.add(node("SEMESTER", "Semester " + ROMAN[i], "Sem " + ROMAN[i], List.of()));

    return List.of(
        stream("School", "🎒", "#FF8A00", "Class 8, 9 and 10 notes, exercise solutions and practice for every subject.", List.of(
            featured("CLASS", "Class 8", null, "8️⃣", subjects("English", "Nepali", "Mathematics", "Science and Technology", "Social Studies", "Health and Physical Education", "Computer Science")),
            featured("CLASS", "Class 9", null, "9️⃣", subjects("English", "Nepali", "Mathematics", "Science and Technology", "Social Studies", "Optional Mathematics", "Computer Science", "Accountancy", "Economics")),
            featured("CLASS", "Class 10", null, "🔟", subjects("English", "Nepali", "Mathematics", "Science and Technology", "Social Studies", "Optional Mathematics", "Computer Science", "Accountancy", "Economics")))),
        stream("SEE", "🏆", "#FF3D7F", "Secondary Education Examination: old questions, model sets, important questions and quick revision.", subjects(
            "English", "Nepali", "Compulsory Mathematics", "Science", "Social Studies", "Optional Mathematics", "Computer Science", "Accountancy")),
        stream("+2 (NEB)", "🔬", "#2F80ED", "Grade 11 and 12 under the National Examinations Board: Science and Management.", List.of(
            featured("FACULTY", "Science", "+2 Science", "🧪", List.of(
                node("CLASS", "Grade 11", "Grade 11", subjects("Physics", "Chemistry", "Biology", "Mathematics", "English", "Nepali", "Computer Science")),
                node("CLASS", "Grade 12", "Grade 12", subjects("Physics", "Chemistry", "Biology", "Mathematics", "English", "Nepali", "Computer Science")))),
            featured("FACULTY", "Management", "+2 Management", "💼", List.of(
                node("CLASS", "Grade 11", "Grade 11", subjects("Accountancy", "Economics", "Business Studies", "Business Mathematics", "English", "Nepali", "Computer Science")),
                node("CLASS", "Grade 12", "Grade 12", subjects("Accountancy", "Economics", "Business Studies", "Business Mathematics", "English", "Nepali", "Computer Science")))))),
        stream("Engineering (IOE)", "⚙️", "#6C3BFF", "Bachelor of Engineering under Tribhuvan University IOE, semester by semester.", List.of(
            featured("PROGRAM", "BE Computer", "BE Computer", "💻", beComputer),
            featured("PROGRAM", "BE Civil", "BE Civil", "🏗️", beCivil))),
        stream("Medical (IOM)", "🩺", "#00B8A9", "MBBS and nursing notes by year, plus clinical summaries.", List.of(
            featured("PROGRAM", "MBBS", "MBBS", "🩻", List.of(
                node("YEAR", "First Year", "Year 1", subjects("Anatomy", "Physiology", "Biochemistry")),
                node("YEAR", "Second Year", "Year 2", subjects("Pathology", "Pharmacology", "Microbiology")),
                node("YEAR", "Third Year", "Year 3", subjects("Community Medicine", "Forensic Medicine", "ENT", "Ophthalmology")),
                node("YEAR", "Fourth Year", "Year 4", subjects("Internal Medicine", "Surgery", "Obstetrics and Gynaecology", "Paediatrics")))),
            node("PROGRAM", "BSc Nursing", "BSc Nursing", List.of(
                node("YEAR", "First Year", "Year 1", List.of()), node("YEAR", "Second Year", "Year 2", List.of()),
                node("YEAR", "Third Year", "Year 3", List.of()), node("YEAR", "Fourth Year", "Year 4", List.of()))))),
        stream("Management", "📊", "#27AE60", "BBS, BBA and other management programs.", List.of(
            featured("PROGRAM", "BBS", "BBS", "📈", List.of(
                node("YEAR", "First Year", "BBS 1st Year", subjects("Business English", "Business Statistics", "Microeconomics", "Financial Accounting and Analysis", "Principles of Management")),
                node("YEAR", "Second Year", "BBS 2nd Year", subjects("Macroeconomics", "Cost and Management Accounting", "Fundamentals of Financial Management", "Organizational Behaviour", "Business Communication")),
                node("YEAR", "Third Year", "BBS 3rd Year", subjects("Business Law", "Taxation in Nepal", "Foundation of Financial Management", "Business Environment and Strategy", "Entrepreneurship")),
                node("YEAR", "Fourth Year", "BBS 4th Year", subjects("Business Research Methods", "Marketing", "Banking")))),
            node("PROGRAM", "BBA", "BBA", bba))),
        stream("IT & Computer", "💻", "#9B51E0", "BSc CSIT and BCA semester notes, labs and old questions.", List.of(
            featured("PROGRAM", "BSc CSIT", "BSc CSIT", "🖥️", csit),
            node("PROGRAM", "BCA", "BCA", bca))),
        stream("Entrance Prep", "🎯", "#EB5757", "Prepare for IOE, CEE (medical) and CMAT entrance exams.", List.of(
            node("EXAM", "IOE Entrance", "IOE Entrance", subjects("Physics", "Chemistry", "Mathematics", "English")),
            node("EXAM", "CEE (Medical)", "CEE", subjects("Physics", "Chemistry", "Zoology", "Botany", "Mental Agility Test")),
            node("EXAM", "CMAT", "CMAT", subjects("Verbal Ability", "Quantitative Ability", "Logical Reasoning", "General Awareness")))),
        stream("Loksewa", "🏛️", "#B7791F", "Public Service Commission preparation: GK, constitution, current affairs.", List.of(
            node("EXAM", "Kharidar", "Kharidar", subjects("General Knowledge", "Constitution of Nepal", "Current Affairs")),
            node("EXAM", "Nayab Subba", "Nayab Subba", subjects("General Knowledge", "Constitution of Nepal", "Public Management", "Current Affairs")),
            node("EXAM", "Section Officer", "Section Officer", subjects("General Knowledge", "Public Policy", "Constitution of Nepal", "Current Affairs")))));
  }

  /** A friendly emoji per subject so cards are recognisable at a glance. */
  static String subjectIcon(String name) {
    String n = name.toLowerCase();
    if (n.contains("math") || n.contains("calculus") || n.contains("statistic") || n.contains("numerical") || n.contains("quantitative")) return "📐";
    if (n.contains("physics")) return "🧲";
    if (n.contains("chem")) return "⚗️";
    if (n.contains("bio") || n.contains("zoology") || n.contains("botany") || n.contains("anatomy") || n.contains("physiology")) return "🧬";
    if (n.contains("science")) return "🔬";
    if (n.contains("english") || n.contains("verbal")) return "📖";
    if (n.contains("nepali")) return "अ";
    if (n.contains("social") || n.contains("constitution") || n.contains("public")) return "🌏";
    if (n.contains("account") || n.contains("tax") || n.contains("cost")) return "🧾";
    if (n.contains("econom") || n.contains("financ") || n.contains("bank")) return "💰";
    if (n.contains("program") || n.contains("computer") || n.contains("software") || n.contains("data") || n.contains("operating") || n.contains("internet") || n.contains("information")) return "💻";
    if (n.contains("electr") || n.contains("circuit") || n.contains("microprocessor") || n.contains("embedded") || n.contains("signal") || n.contains("instrument")) return "🔌";
    if (n.contains("drawing") || n.contains("graphics")) return "📏";
    if (n.contains("mechanic") || n.contains("thermo") || n.contains("workshop") || n.contains("machine")) return "⚙️";
    if (n.contains("health") || n.contains("medicine") || n.contains("surgery") || n.contains("pathology") || n.contains("pharma") || n.contains("paed") || n.contains("gyna")) return "🩺";
    if (n.contains("management") || n.contains("business") || n.contains("market") || n.contains("entrepreneur")) return "💼";
    if (n.contains("knowledge") || n.contains("awareness") || n.contains("current")) return "📰";
    if (n.contains("logic") || n.contains("reasoning") || n.contains("agility") || n.contains("computation")) return "🧠";
    return "📘";
  }
}
