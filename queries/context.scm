; =========================
; Structural context nodes
; =========================

; 类：显示到类体开始前（避免把整个 body 展示出来）
(class_declaration
  body: (class_body) @context.end) @context

; ====== 函数/方法/构造 ======
; 构造器 init：显示到函数体开始前
(init_declaration
  body: (function_body (block) @context.end)) @context

; 普通函数/方法：显示到函数体开始前
(function_declaration
  body: (function_body (block) @context.end)) @context

(if_expression
  consequence: (block) @context.end) @context

(for_statement
  pattern: (pattern) @context.end) @context

(while_statement
  condition: (expression) @context.end) @context

(match_expression
  subject:(_) @context.end) @context

; 想要的话，还可以把包名作为最上层上下文（通常不需要）：
; (package_clause) @context

