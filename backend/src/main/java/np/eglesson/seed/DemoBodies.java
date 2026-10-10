package np.eglesson.seed;

/** Sample note bodies in the same HTML the admin editor produces (headings, lists, tables, formulas, code). */
final class DemoBodies {
  private DemoBodies() {}

  static final String FORCE = """
      <h2>What is force?</h2>
      <p>A <strong>force</strong> is a push or a pull that can change the state of rest or motion of a body, or change its shape. Its SI unit is the <strong>newton (N)</strong>.</p>
      <blockquote>1 newton is the force that gives a 1 kg mass an acceleration of 1 m/s².</blockquote>
      <h2>Newton's laws of motion</h2>
      <h3>1. First law (law of inertia)</h3>
      <p>A body stays at rest, or keeps moving in a straight line at constant speed, unless an unbalanced external force acts on it.</p>
      <ul><li>Passengers lean forward when a bus stops suddenly.</li><li>Dust leaves a carpet when it is beaten with a stick.</li></ul>
      <h3>2. Second law</h3>
      <p>The rate of change of momentum is proportional to the applied force:</p>
      <p><span class="ql-formula" data-value="F = ma"></span></p>
      <h3>3. Third law</h3>
      <p>To every action there is an equal and opposite reaction. Example: a rocket pushes gases backward and moves forward.</p>
      <h2>Equations of motion</h2>
      <table><thead><tr><th>Equation</th><th>Use it when you don't know…</th></tr></thead><tbody>
      <tr><td><span class="ql-formula" data-value="v = u + at"></span></td><td>distance (s)</td></tr>
      <tr><td><span class="ql-formula" data-value="s = ut + \\tfrac{1}{2}at^2"></span></td><td>final velocity (v)</td></tr>
      <tr><td><span class="ql-formula" data-value="v^2 = u^2 + 2as"></span></td><td>time (t)</td></tr>
      </tbody></table>
      <h2>Solved example</h2>
      <p>A car starts from rest and reaches 20 m/s in 5 s. Find its acceleration.</p>
      <p><strong>Solution:</strong> u = 0, v = 20 m/s, t = 5 s. Using <span class="ql-formula" data-value="a = \\frac{v-u}{t}"></span>, a = 20 / 5 = <strong>4 m/s²</strong>.</p>
      <h2>Exam tips</h2>
      <ol><li>Always write the formula before substituting values.</li><li>Keep units in every line of the working.</li><li>Draw a free-body diagram for force questions.</li></ol>
      """;

  static final String SETS = """
      <h2>Key formulas</h2>
      <p>For two sets A and B:</p>
      <p><span class="ql-formula" data-value="n(A \\cup B) = n(A) + n(B) - n(A \\cap B)"></span></p>
      <p><span class="ql-formula" data-value="n_o(A) = n(A) - n(A \\cap B)"></span> (only A)</p>
      <h2>Question 1</h2>
      <p>In a class of 50 students, 30 like Mathematics, 25 like Science and 10 like both. How many like neither?</p>
      <h3>Solution</h3>
      <ol><li>n(U) = 50, n(M) = 30, n(S) = 25, n(M ∩ S) = 10</li><li>n(M ∪ S) = 30 + 25 − 10 = 45</li><li>Neither = n(U) − n(M ∪ S) = 50 − 45 = <strong>5 students</strong></li></ol>
      <h2>Question 2</h2>
      <p>Out of 100 people, 60 drink tea and 45 drink coffee. If 15 drink neither, how many drink both?</p>
      <h3>Solution</h3>
      <p>n(T ∪ C) = 100 − 15 = 85. So n(T ∩ C) = 60 + 45 − 85 = <strong>20 people</strong>.</p>
      <blockquote>Tip: draw the Venn diagram first and fill in the "both" region before anything else.</blockquote>
      """;

  static final String LIMITS = """
      <h2>Definition</h2>
      <p>We say <span class="ql-formula" data-value="\\lim_{x \\to a} f(x) = L"></span> if f(x) gets arbitrarily close to L as x approaches a from either side.</p>
      <h2>Standard limits</h2>
      <ul>
      <li><span class="ql-formula" data-value="\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1"></span></li>
      <li><span class="ql-formula" data-value="\\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1"></span></li>
      <li><span class="ql-formula" data-value="\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e"></span></li>
      </ul>
      <h2>Continuity</h2>
      <p>f is continuous at x = a when all three hold:</p>
      <ol><li>f(a) is defined</li><li>the limit as x → a exists</li><li>the limit equals f(a)</li></ol>
      <h2>Worked example</h2>
      <p>Is <span class="ql-formula" data-value="f(x) = \\frac{x^2-4}{x-2}"></span> continuous at x = 2?</p>
      <p>f(2) is undefined (0/0), so f is <strong>not continuous</strong> at 2, although the limit exists and equals 4. This is a <em>removable discontinuity</em>.</p>
      """;

  static final String POINTERS = """
      <h2>Arrays</h2>
      <p>An array stores elements of the same type in consecutive memory locations.</p>
      <pre class="ql-syntax" spellcheck="false">int marks[5] = {78, 85, 91, 66, 72};
      printf("%d", marks[2]);   // 91
      </pre>
      <h2>Pointers</h2>
      <p>A pointer holds the <strong>address</strong> of another variable.</p>
      <pre class="ql-syntax" spellcheck="false">int x = 10;
      int *p = &amp;x;     // p stores the address of x
      printf("%d", *p); // 10 — dereferencing p gives x
      </pre>
      <h2>Arrays and pointers together</h2>
      <p>The array name is the address of its first element, so <code>marks[i]</code> is the same as <code>*(marks + i)</code>.</p>
      <table><thead><tr><th>Expression</th><th>Meaning</th></tr></thead><tbody>
      <tr><td><code>marks</code></td><td>address of marks[0]</td></tr>
      <tr><td><code>marks + 1</code></td><td>address of marks[1]</td></tr>
      <tr><td><code>*(marks + 1)</code></td><td>value of marks[1] (85)</td></tr></tbody></table>
      <h2>Common exam question</h2>
      <p>Write a program to find the sum of an array using a pointer.</p>
      <pre class="ql-syntax" spellcheck="false">int sum(int *a, int n) {
          int s = 0;
          for (int i = 0; i &lt; n; i++) s += *(a + i);
          return s;
      }
      </pre>
      """;

  static final String UNITS = """
      <h2>Fundamental and derived units</h2>
      <p>Seven <strong>fundamental (base) quantities</strong> have SI units defined independently; every other unit is <em>derived</em> from them.</p>
      <table><thead><tr><th>Quantity</th><th>SI unit</th><th>Symbol</th></tr></thead><tbody>
      <tr><td>Length</td><td>metre</td><td>m</td></tr><tr><td>Mass</td><td>kilogram</td><td>kg</td></tr>
      <tr><td>Time</td><td>second</td><td>s</td></tr><tr><td>Electric current</td><td>ampere</td><td>A</td></tr>
      <tr><td>Temperature</td><td>kelvin</td><td>K</td></tr><tr><td>Amount of substance</td><td>mole</td><td>mol</td></tr>
      <tr><td>Luminous intensity</td><td>candela</td><td>cd</td></tr></tbody></table>
      <h2>Dimensional formula</h2>
      <p>Force = mass × acceleration, so <span class="ql-formula" data-value="[F] = [MLT^{-2}]"></span>.</p>
      <h2>Uses of dimensional analysis</h2>
      <ol><li>Checking whether an equation is dimensionally correct</li><li>Converting units from one system to another</li><li>Deriving relations between physical quantities</li></ol>
      """;

  static final String ENGLISH_OLD = """
      <h2>Group A — Reading (solved)</h2>
      <p><strong>Q1.</strong> Read the passage and answer: <em>Why did the narrator visit Pokhara?</em></p>
      <p><strong>Answer:</strong> The narrator visited Pokhara to attend a cousin's wedding and to see Phewa Lake for the first time.</p>
      <h2>Group B — Grammar</h2>
      <p>Change into reported speech: <em>He said, "I am reading a book."</em></p>
      <p><strong>Answer:</strong> He said that he was reading a book.</p>
      <h2>Group C — Writing</h2>
      <p>Write a short notice informing students about a sports week. Include: date, venue, events, contact person.</p>
      <blockquote>Marking tip: notices score on format (heading, date, issuing authority) as much as on content.</blockquote>
      """;

  static final String STACK = """
      <h2>Stack (LIFO)</h2>
      <p>A stack allows insertion and deletion at one end only, called the <strong>top</strong>. The last element pushed is the first one popped.</p>
      <ul><li><code>push(x)</code> — add x on top; overflow when full</li><li><code>pop()</code> — remove top; underflow when empty</li><li><code>peek()</code> — read top without removing</li></ul>
      <h2>Queue (FIFO)</h2>
      <p>A queue inserts at the <strong>rear</strong> and deletes from the <strong>front</strong>.</p>
      <h3>Circular queue</h3>
      <p>Avoids wasted space by wrapping around: <span class="ql-formula" data-value="rear = (rear + 1) \\bmod N"></span></p>
      <h2>Applications</h2>
      <table><thead><tr><th>Stack</th><th>Queue</th></tr></thead><tbody>
      <tr><td>Function calls / recursion</td><td>CPU scheduling</td></tr>
      <tr><td>Expression evaluation (postfix)</td><td>Printer spooling</td></tr>
      <tr><td>Undo in editors</td><td>Breadth-first search</td></tr></tbody></table>
      """;

  static final String NEPALI = """
      <h2>नाम</h2>
      <p>कुनै व्यक्ति, वस्तु, ठाउँ वा भावलाई जनाउने शब्दलाई <strong>नाम</strong> भनिन्छ। जस्तै: राम, काठमाडौँ, किताब, खुसी।</p>
      <h3>नामका प्रकार</h3>
      <ol><li><strong>व्यक्तिवाचक नाम</strong> — राम, सगरमाथा, नेपाल</li><li><strong>जातिवाचक नाम</strong> — मान्छे, नदी, पहाड</li><li><strong>समूहवाचक नाम</strong> — सेना, कक्षा, भीड</li><li><strong>द्रव्यवाचक नाम</strong> — पानी, सुन, दूध</li><li><strong>भाववाचक नाम</strong> — माया, दया, सुन्दरता</li></ol>
      <h2>सर्वनाम</h2>
      <p>नामको सट्टामा प्रयोग हुने शब्दलाई <strong>सर्वनाम</strong> भनिन्छ। जस्तै: म, तिमी, ऊ, हामी, यो, त्यो।</p>
      <blockquote>उदाहरण: <em>राम</em> स्कुल गयो। <em>ऊ</em> पढ्न मन पराउँछ। (यहाँ "ऊ" ले रामलाई जनाएको छ।)</blockquote>
      """;

  static final String FORMULAS = """
      <h2>Kinematics</h2>
      <ul>
      <li><span class="ql-formula" data-value="v = u + at"></span></li>
      <li><span class="ql-formula" data-value="s = ut + \\tfrac12 at^2"></span></li>
      <li><span class="ql-formula" data-value="v^2 - u^2 = 2as"></span></li>
      </ul>
      <h2>Projectile motion</h2>
      <ul>
      <li>Time of flight: <span class="ql-formula" data-value="T = \\frac{2u\\sin\\theta}{g}"></span></li>
      <li>Maximum height: <span class="ql-formula" data-value="H = \\frac{u^2\\sin^2\\theta}{2g}"></span></li>
      <li>Range: <span class="ql-formula" data-value="R = \\frac{u^2\\sin 2\\theta}{g}"></span></li>
      </ul>
      <h2>Work, energy, power</h2>
      <ul>
      <li><span class="ql-formula" data-value="W = Fs\\cos\\theta"></span></li>
      <li><span class="ql-formula" data-value="KE = \\tfrac12 mv^2,\\quad PE = mgh"></span></li>
      <li><span class="ql-formula" data-value="P = \\frac{W}{t}"></span></li>
      </ul>
      """;
}
