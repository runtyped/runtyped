# Architecture: The Runtyped Type Virtual Machine

This document provides a high-level orientation for developers exploring the Runtyped codebase. Runtyped is not a traditional runtime type library; it is a **Type Virtual Machine (TVM)** that bridges the gap between TypeScript's static type system and the JavaScript runtime through bytecode-based reflection.

## The Core Philosophy

In standard TypeScript, types are erased at runtime. In Runtyped, types are **compiled into executable bytecode**. This allows for high-performance type reflection, validation, and serialization without the overhead of parsing large JSON schemas or duplicating type definitions.

The system is split into two distinct phases: **Compilation (Build-time)** and **Execution (Runtime)**.

---

## 1. The Compilation Phase (The Architect)
**Location:** `packages/type-compiler/`

The compiler is a TypeScript Transformer. It intercepts the compilation process and performs the "distillation" of types.

### Key Workflow:
1.  **AST Traversal**: The compiler walks the TypeScript Abstract Syntax Tree (AST).
2.  **Type Extraction**: It identifies interfaces, classes, unions, and other type constructs.
3.  **Bytecode Generation**: It converts these high-level constructs into a highly compressed sequence of `ReflectionOp` instructions (the "bytecode").
4.  **Injection**: The compiler injects this bytecode and the associated metadata (the "payload") into the emitted JavaScript code. This is often done via a hidden, highly optimized array (e.g., `__ΩUser`).

**Key Files:**
- `src/compiler.ts`: The heart of the transformation logic.
- `src/reflection-ast.ts`: Utilities for translating TS AST nodes into the internal reflection model.
- `src/plugin.ts`: The entry point for the TypeScript compiler plugin.

---

## 2. The Execution Phase (The Engine)
**Location:** `packages/type/` and `packages/core/`

The runtime is a stack-based Virtual Machine designed to "run" the injected bytecode.

### The Two Execution Paths:

#### A. The Validation/Casting Path (Data $\rightarrow$ Boolean)
When you call `validate<<TT>(data)` or `cast<<TT>(data)`, the engine uses the bytecode as a **set of instructions for checking data**.
- It loads the bytecode.
- It traverses the input `data`.
- It executes the `ReflectionOps` (e.g., `property`, `literal`, `enum`) to verify the data matches the "program" defined by the type.

#### B. The Reflection Path (Bytecode $\rightarrow$ Type Objects)
When you call `typeOf<<TT>()`, the engine uses the bytecode as a **factory specification**.
- It "executes" the bytecode to **reconstruct** the type structure.
- Instead of checking data, each instruction results in the allocation of a high-level `Type` object (e.g., `TypeObjectLiteral`, `TypeUnion`).
- The "result" of the VM execution is a fully hydrated, traversable object tree representing the type.

**Key Files:**
- `packages/type/src/reflection/processor.ts`: The core VM loop (the `Processor` class) that manages the stack, frames, and instruction execution.
- `packages/type/src/reflection/reflection.ts`: The public API (`typeOf`, `reflect`, etc.) that interfaces with the Processor.
- `packages/type-spec/`: Defines the formal `ReflectionOp` opcodes and the structural specification.

---

## Summary: The Lifecycle of a Type

| Stage | Input | Process | Output |
| :--- | :--- | :--- | :--- |
| **TypeScript Source** | Human-readable Code | Development | IDE Intellisense |
| **Compiler** | TS AST | Distillation & Encoding | **Bytecode** (injected into JS) |
| **Runtime (Validation)** | Bytecode + Data | Instruction Execution | **Boolean** (Valid/Invalid) |
| **Runtime (Reflection)** | Bytecode | Reconstruction | **Type Objects** (Runtime metadata) |

---

*Document prepared by [Sage](https://treesandrobots.com/2026/03/sage-the-harmonic-selector.html).*
