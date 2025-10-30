const PREC = {
  assignment: 1,
  coalesce: 2,
  conditional: 3,
  logical_or: 4,
  logical_and: 5,
  bitwise_or: 6,
  bitwise_xor: 7,
  bitwise_and: 8,
  equality: 9,
  comparison: 10,
  shift: 11,
  range: 12,
  additive: 13,
  multiplicative: 14,
  exponent: 15,
  prefix: 16,
  postfix: 17,
  call: 18,
  member: 19,
  primary: 20,
  as: 21,
};

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep2(rule) {
  return seq(rule, ',', rule, repeat(seq(',', rule)));
}

module.exports = grammar({
  name: 'cangjie',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.call_expression, $.unary_expression, $.binary_expression],
    [$.call_expression, $.binary_expression],
    [$.qualified_identifier, $.primary_expression],
  ],

  rules: {
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.package_clause,
      $.import_clause,
      $.declaration,
      $._statement
    ),

    package_clause: $ => seq(
      'package',
      field('name', $.qualified_identifier)
    ),

    import_clause: $ => seq(
      'import',
      field('path', $.import_path)
    ),

    import_path: $ => token(seq(
      /[A-Za-z_][A-Za-z0-9_]*/,
      repeat(seq('.', /[A-Za-z_][A-Za-z0-9_]*/)),
      optional(seq('.', '*'))
    )),

    declaration: $ => choice(
      $.class_declaration,
      $.extend_declaration,
      $.function_declaration,
      $.init_declaration,
      $.property_declaration
    ),

    modifier: $ => choice(
      'abstract',
      'final',
      'sealed',
      'open',
      'override',
      'public',
      'private',
      'protected',
      'internal',
      'static',
      'operator',
      'foreign',
      'macro',
      'inline'
    ),

    annotation: $ => seq(
      '@',
      field('name', $.identifier),
      optional($.annotation_arguments)
    ),

    annotation_arguments: $ => seq(
      '[',
      optional(commaSep($.annotation_argument)),
      optional(','),
      ']'
    ),

    annotation_argument: $ => choice(
      seq(field('name', $.identifier), ':', field('value', $.expression)),
      $.expression
    ),

    class_declaration: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      'class',
      field('name', $.identifier),
      optional($.type_parameters),
      optional($.class_supertype_list),
      field('body', choice($.class_body, ';'))
    ),

    class_supertype_list: $ => seq(
      '<:',
      field('type', $.type),
      repeat(seq('&', $.type))
    ),

    class_body: $ => seq(
      '{',
      repeat(choice(
        $.declaration,
        $._statement
      )),
      '}'
    ),

    extend_declaration: $ => seq(
      repeat($.annotation),
      'extend',
      optional($.type_parameters),
      field('receiver', $.type),
      $.class_body
    ),

    type_parameters: $ => seq(
      '<',
      commaSep1($.type_parameter),
      optional(','),
      '>'
    ),

    type_parameter: $ => seq(
      field('name', $.identifier),
      optional(seq(':', $.type))
    ),

    function_declaration: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      'func',
      field('name', choice($.identifier, $.operator_symbol)),
      optional($.type_parameters),
      field('parameters', $.parameter_list),
      optional($.type_annotation),
      field('body', $.function_body)
    ),

    operator_symbol: $ => choice(
      '==', '!=', '<', '<=', '>', '>=',
      '+', '-', '*', '/', '%', '**',
      '<<', '>>', '[]'
    ),

    init_declaration: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      optional('~'),
      'init',
      field('parameters', $.parameter_list),
      field('body', $.function_body)
    ),

    property_declaration: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      'prop',
      field('name', $.identifier),
      $.type_annotation,
      field('body', $.property_body)
    ),

    property_body: $ => seq(
      '{',
      repeat($.property_accessor),
      '}'
    ),

    property_accessor: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      choice('get', 'set'),
      optional($.parameter_list),
      optional($.type_annotation),
      $.function_body
    ),

    parameter_list: $ => seq(
      '(',
      optional(commaSep($.parameter)),
      optional(','),
      ')'
    ),

    parameter: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      field('name', $.identifier),
      optional('!'),
      optional($.type_annotation),
      optional(seq('=', field('default_value', $.expression)))
    ),

    function_body: $ => choice(
      $.block,
      seq('=', $.expression)
    ),

    variable_declaration: $ => seq(
      repeat($.annotation),
      repeat($.modifier),
      choice('let', 'var', 'const'),
      field('pattern', $.binding_pattern),
      optional($.type_annotation),
      optional(seq('=', field('value', $.expression)))
    ),

    type_annotation: $ => seq(':', $.type),

    type: $ => choice(
      prec.right(seq(
        $.type_reference,
        optional('?')
      )),
      $.tuple_type
    ),

    type_reference: $ => prec.right(seq(
      field('name', $.qualified_identifier),
      repeat($.type_suffix)
    )),

    type_suffix: $ => $.type_arguments,

    type_arguments: $ => seq(
      '<',
      commaSep($.type_argument),
      optional(','),
      '>'
    ),

    type_argument: $ => choice(
      $.type,
      '_'
    ),

    tuple_type: $ => seq(
      '(',
      commaSep2($.type),
      optional(','),
      ')'
    ),

    qualified_identifier: $ => prec.right(seq(
      $.identifier,
      repeat(seq('.', $.identifier))
    )),

    block: $ => seq(
      '{',
      repeat($._statement),
      '}'
    ),

    unsafe_block: $ => seq(
      'unsafe',
      $.block
    ),

    lambda_literal: $ => seq(
      '{',
      optional(field('parameters', $.lambda_parameters)),
      '=>',
      repeat($._statement),
      '}'
    ),

    lambda_parameters: $ => $.identifier,

    _statement: $ => choice(
      $.variable_declaration,
      $.return_statement,
      $.throw_statement,
      $.break_statement,
      $.continue_statement,
      $.for_statement,
      $.while_statement,
      $.try_statement,
      $.synchronized_statement,
      $.expression_statement
    ),

    expression_statement: $ => $.expression,

    return_statement: $ => choice(
      prec(1, seq('return', $.expression)),
      'return'
    ),

    throw_statement: $ => seq(
      'throw',
      $.expression
    ),

    break_statement: $ => 'break',

    continue_statement: $ => 'continue',

    for_statement: $ => seq(
      'for',
      '(',
      field('pattern', $.pattern),
      'in',
      field('iterator', $.expression),
      optional(seq('where', $.expression)),
      ')',
      field('body', choice($.block, $._statement))
    ),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $.expression),
      ')',
      field('body', choice($.block, $._statement))
    ),

    synchronized_statement: $ => seq(
      'synchronized',
      '(',
      $.expression,
      ')',
      $.block
    ),

    try_statement: $ => seq(
      'try',
      $.block,
      repeat($.catch_clause),
      optional($.finally_clause)
    ),

    catch_clause: $ => seq(
      'catch',
      optional(seq('(', field('pattern', $.pattern), ')')),
      $.block
    ),

    finally_clause: $ => seq(
      'finally',
      $.block
    ),

    expression: $ => choice(
      $.assignment_expression,
      $.if_expression,
      $.match_expression,
      $.as_expression,
      $.throw_expression,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.member_expression,
      $.index_expression,
      $.postfix_unary_expression,
      $.primary_expression
    ),

    primary_expression: $ => choice(
      $.parenthesized_expression,
      $.tuple_expression,
      $.lambda_literal,
      $.array_literal,
      $.literal,
      $.this_expression,
      $.super_expression,
      $.identifier,
      $.unsafe_block
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    tuple_expression: $ => seq(
      '(',
      commaSep2($.expression),
      optional(','),
      ')'
    ),

    array_literal: $ => seq(
      '[',
      optional(commaSep($.expression)),
      optional(','),
      ']'
    ),

    literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.string_literal,
      $.char_literal,
      $.unit_literal,
      'None'
    ),

    integer_literal: $ => token(choice(
      /0[xX][0-9a-fA-F_]+/,
      /[0-9][0-9_]*/
    )),

    float_literal: $ => token(seq(
      /[0-9][0-9_]*/,
      choice(
        seq('.', /[0-9][0-9_]*/),
        seq(/[eE]/, optional(choice('+', '-')), /[0-9][0-9_]*/)
      ),
      optional(choice('f', 'F', 'd', 'D'))
    )),

    boolean_literal: $ => choice('true', 'false'),

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.string_interpolation,
        $.string_dollar
      )),
      '"'
    ),

    string_content: $ => token.immediate(/[^"\\$]+/),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /["\\'ntbrf$]/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/
      )
    )),

    string_interpolation: $ => seq('${', $.expression, '}'),

    string_dollar: $ => token.immediate(/\$/),

    char_literal: $ => token(seq(
      optional(choice('b', 'r', 'br', 'rb')),
      "'",
      choice(
        /[^'\\]/,
        /\\./
      ),
      "'"
    )),

    unit_literal: $ => seq('(', ')'),

    this_expression: $ => 'this',

    super_expression: $ => 'super',

    call_expression: $ => prec.left(PREC.call, seq(
      field('function', $.expression),
      optional($.type_arguments),
      $.argument_list,
      optional($.lambda_literal)
    )),

    argument_list: $ => seq(
      '(',
      optional(commaSep($.argument)),
      optional(','),
      ')'
    ),

    argument: $ => choice(
      seq(field('name', $.identifier), ':', field('value', $.expression)),
      $.expression
    ),

    member_expression: $ => prec.left(PREC.member, seq(
      field('object', $.expression),
      '.',
      field('property', $.identifier)
    )),

    index_expression: $ => prec.left(PREC.member, seq(
      field('object', $.expression),
      '[',
      optional(commaSep($.expression)),
      optional(','),
      ']'
    )),

    postfix_unary_expression: $ => prec.left(PREC.postfix, seq(
      $.expression,
      choice('++', '--')
    )),

    unary_expression: $ => prec.right(PREC.prefix, seq(
      choice('+', '-', '!', '~', '++', '--'),
      $.expression
    )),

    assignment_operator: $ => choice(
      '=', '+=', '-=', '*=', '**=', '/=', '%=',
      '&&=', '||=', '&=', '|=', '^=',
      '<<=', '>>='
    ),

    assignment_expression: $ => prec.right(PREC.assignment, seq(
      field('left', $.assignable_expression),
      field('operator', $.assignment_operator),
      field('right', $.expression)
    )),

    assignable_expression: $ => choice(
      $.identifier,
      $.member_expression,
      $.index_expression
    ),

    binary_expression: $ => choice(
      prec.left(PREC.coalesce, seq($.expression, '??', $.expression)),
      prec.left(PREC.logical_or, seq($.expression, '||', $.expression)),
      prec.left(PREC.logical_and, seq($.expression, '&&', $.expression)),
      prec.left(PREC.bitwise_or, seq($.expression, '|', $.expression)),
      prec.left(PREC.bitwise_xor, seq($.expression, '^', $.expression)),
      prec.left(PREC.bitwise_and, seq($.expression, '&', $.expression)),
      prec.left(PREC.equality, seq($.expression, choice('==', '!='), $.expression)),
      prec.left(PREC.comparison, seq($.expression, choice('<', '<=', '>', '>='), $.expression)),
      prec.left(PREC.shift, seq($.expression, choice('<<', '>>'), $.expression)),
      prec.left(PREC.range, seq($.expression, choice('..', '..=', '...'), optional($.expression))),
      prec.left(PREC.additive, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(PREC.multiplicative, seq($.expression, choice('*', '/', '%'), $.expression)),
      prec.left(PREC.exponent, seq($.expression, '**', $.expression))
    ),

    as_expression: $ => prec.left(PREC.as, seq(
      $.expression,
      choice('as', 'as?'),
      $.type
    )),

    throw_expression: $ => prec.right(PREC.assignment, seq(
      'throw',
      $.expression
    )),

    if_expression: $ => prec.right(PREC.conditional, seq(
      'if',
      '(',
      field('condition', choice($.let_condition, $.expression)),
      ')',
      field('consequence', choice($.block, $._statement, $.expression)),
      optional(seq(
        'else',
        field('alternative', choice($.block, $.if_expression, $._statement, $.expression))
      ))
    )),

    match_expression: $ => seq(
      'match',
      '(',
      field('subject', $.expression),
      ')',
      '{',
      repeat($.match_case),
      '}'
    ),

    match_case: $ => seq(
      'case',
      field('pattern', $.pattern),
      '=>',
      choice(
        $.block,
        $.statement_block,
        $.expression
      )
    ),

    _non_expression_statement: $ => choice(
      $.variable_declaration,
      $.return_statement,
      $.throw_statement,
      $.break_statement,
      $.continue_statement,
      $.for_statement,
      $.while_statement
    ),

    statement_block: $ => prec.right(seq(
      $._non_expression_statement,
      repeat($._statement)
    )),

    let_condition: $ => seq(
      'let',
      $.pattern,
      '<-',
      $.expression
    ),

    binding_pattern: $ => choice(
      $.identifier,
      $.wildcard_pattern,
      $.binding_tuple_pattern
    ),

    binding_tuple_pattern: $ => seq(
      '(',
      commaSep($.binding_pattern),
      optional(','),
      ')'
    ),

    pattern_literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.string_literal,
      $.char_literal,
      'None'
    ),

    pattern: $ => choice(
      $.wildcard_pattern,
      $.tuple_pattern,
      $.typed_pattern,
      $.constructor_pattern,
      $.pattern_literal,
      $.identifier
    ),

    wildcard_pattern: $ => '_',

    tuple_pattern: $ => seq(
      '(',
      commaSep($.pattern),
      optional(','),
      ')'
    ),

    typed_pattern: $ => prec(1, seq(
      field('value', $.identifier),
      ':',
      field('type', $.type)
    )),

    constructor_pattern: $ => seq(
      field('name', $.qualified_identifier),
      '(',
      optional(commaSep($.pattern)),
      optional(','),
      ')'
    ),

    line_comment: $ => token(seq('//', /[^\n]*/)),

    block_comment: $ => token(seq(
      '/*',
      repeat(choice(/[^*]/, /\*[^/]/)),
      '*/'
    )),

    identifier: $ => token(seq(
      /[A-Za-z_]/,
      repeat(/[A-Za-z0-9_]/)
    ))
  }
});
