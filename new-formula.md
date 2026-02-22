Perfect.
Here is a **clean, production-ready summary of Phase 1 formulas**, in English, including:

* Facet Score
* Facet Confidence
* Facet Signal Power
* Simple Steering Policy

**Without using Agreement in steering.**

This is your lean, robust V1 architecture.

---

# 🔹 Notation

For a given facet ( f ):

For each evidence ( i ):

* ( x_i \in [0,20] ) → evidence score
* ( c_i \in [0,1] ) → evidence confidence
* ( g(i) ) → context (work, friends, family, self_report, behavior, etc.)

For each context ( g ):

* ( I_{f,g} ) = set of evidences of facet ( f ) in context ( g )

---

# 1️⃣ Facet Score (robust to redundancy)

## Step 1 — Context-level weighted mean

[
\mu_g =
\frac{\sum_{i\in I_{f,g}} c_i x_i}
{\sum_{i\in I_{f,g}} c_i}
]

---

## Step 2 — Context weight (anti-redundancy)

[
w_g = \sqrt{\sum_{i\in I_{f,g}} c_i}
]

Why square root?

* Diminishing returns within the same context
* Adding a new context has real impact

---

## Step 3 — Final facet score

[
\boxed{
S_f =
\frac{\sum_g w_g \mu_g}
{\sum_g w_g}
}
]

Result:

* ( S_f \in [0,20] )
* Robust to repeated signals inside one context

---

# 2️⃣ Facet Confidence (how well supported the estimate is)

Define total diversified evidence mass:

[
W = \sum_g w_g
]

Then:

[
\boxed{
C_f = C_{max}\left(1 - e^{-k W}\right)
}
]

### Recommended parameters

* ( C_{max} = 0.9 )
* ( k \approx 0.5 - 0.7 )

Properties:

* Monotonic increasing
* Saturating
* Never reaches 1
* Increases with both volume and context diversity

---

# 3️⃣ Facet Signal Power (cross-context robustness)

Signal power measures:

> How robust and cross-context the signal is.

---

## Step 1 — Context distribution

[
p_g = \frac{w_g}{\sum_h w_h}
]

---

## Step 2 — Context diversity (normalized entropy)

[
\boxed{
D =
\frac{-\sum_g p_g \ln(p_g)}
{\ln(|G|)}
}
]

* ( D \in [0,1] )
* 0 → single dominant context
* 1 → balanced across contexts

---

## Step 3 — Volume saturation

[
V = 1 - e^{-\beta W}
]

Recommended:

* ( \beta \approx k )

---

## Final Signal Power

[
\boxed{
P_f = V \times D
}
]

Interpretation:

* (V) = enough material
* (D) = spread across contexts
* (P_f \in [0,1])

Note: In Phase 1 we exclude Agreement from steering.

---

# 4️⃣ Simple Steering Policy (Facet + Context Selection)

Goal:

* Cover unknown facets
* Increase robustness
* Explore missing contexts

---

## Step 1 — Facet Priority

[
\boxed{
FacetPriority_f =
\alpha (C_{target} - C_f)*+
+
\beta (P*{target} - P_f)_+
}
]

Where:

* ( (x)_+ = \max(0,x) )

### Recommended values

* ( C_{target} = 0.75 )
* ( P_{target} = 0.5 )
* ( \alpha = 1.0 )
* ( \beta = 0.8 )

Interpretation:

* Low confidence → high priority
* Low power → high priority

Select the facet with highest priority.

---

## Step 2 — Context Selection (for chosen facet)

Define need per context:

[
Need(f,g) =
1 -
\frac{w_{f,g}}
{\max_h w_{f,h} + \epsilon}
]

Then:

[
\boxed{
ContextPriority_g =
Need(f,g)
+
\eta \cdot \mathbf{1}(w_{f,g}=0)
}
]

Recommended:

* ( \eta = 0.3 )

Select the context with highest priority.

---

# 🔥 Behavioral Dynamics of Phase 1

Early conversation:

* Focus on low-confidence facets.

Mid conversation:

* Improve cross-context diversity (increase power).

Late conversation:

* Most facets above target → system stabilizes.

This creates natural exploration → diversification → refinement.

---

# 🏁 Final Compact Formula Summary

### Facet Score

[
S_f =
\frac{\sum_g \sqrt{\sum c_i} ,\mu_g}
{\sum_g \sqrt{\sum c_i}}
]

---

### Facet Confidence

[
C_f = 0.9(1 - e^{-k\sum_g w_g})
]

---

### Facet Signal Power

[
P_f =
(1 - e^{-\beta \sum_g w_g})
\times
\text{Entropy}(p_g)
]

---

### Steering

[
FacetPriority_f =
(C_{target} - C_f)*+
+
0.8 (P*{target} - P_f)_+
]

Then choose the least-covered context.