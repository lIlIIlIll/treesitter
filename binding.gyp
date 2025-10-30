{
  "targets": [
    {
      "target_name": "tree_sitter_cangjie",
      "include_dirs": [
        "<!(node -p \"require('nan')\")"
      ],
      "sources": [
        "src/parser.c"
      ],
      "cflags_c": [
        "-std=c11",
        "-Wno-unused-parameter",
        "-Wno-missing-field-initializers"
      ]
    }
  ]
}
