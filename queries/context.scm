; =========================
; Structural context nodes
; =========================

(package_clause
  name: (qualified_identifier) @context)

(class_declaration
  name: (identifier) @context)

(extend_declaration
  receiver: (type) @context)

(function_declaration
  name: (identifier) @context)
(function_declaration
  name: (operator_symbol) @context)

(init_declaration
  "init" @context)

(property_declaration
  name: (identifier) @context)

(match_expression
  "match" @context)

(match_case
  pattern: (_) @context)

(if_expression
  "if" @context)

(for_statement
  "for" @context)

(while_statement
  "while" @context)

(lambda_literal
  parameters: (_) @context)
