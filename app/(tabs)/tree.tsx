import {
  Canvas,
  Path,
  Skia
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── L-System Config ──────────────────────────────────────────────────────────

const AXIOM = "F";

const RULES: Record<string, string> = {
  F: "FF+[+F-F-F]-[-F+F+F]",
};

const ITERATIONS = 4;
const ANGLE_DEG = 25;
const STEP_LENGTH = 5;
const STEP_SCALE = 0.5; // shrinks step per depth level

// ─── L-System Expansion ───────────────────────────────────────────────────────

function expand(axiom: string, rules: Record<string, string>, n: number): string {
  let result = axiom;
  for (let i = 0; i < n; i++) {
    result = result
      .split("")
      .map((ch) => rules[ch] ?? ch)
      .join("");
  }
  return result;
}

// ─── Turtle Interpreter ───────────────────────────────────────────────────────

interface TurtleState {
  x: number;
  y: number;
  angle: number; // in radians
  stepLen: number;
  depth: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  isStem: boolean;
}

interface Leaf {
  x: number;
  y: number;
  angle: number;
  depth: number;
}

function interpret(
  lstring: string,
  startX: number,
  startY: number,
  angleDeg: number,
  stepLen: number,
  stepScale: number
): { segments: Segment[]; leaves: Leaf[] } {
  const stack: TurtleState[] = [];
  const segments: Segment[] = [];
  const leaves: Leaf[] = [];

  const angleRad = (angleDeg * Math.PI) / 180;

  let state: TurtleState = {
    x: startX,
    y: startY,
    angle: -Math.PI / 2, // pointing up
    stepLen,
    depth: 0,
  };

  for (const ch of lstring) {
    switch (ch) {
      case "F": {
        const nx = state.x + Math.cos(state.angle) * state.stepLen;
        const ny = state.y + Math.sin(state.angle) * state.stepLen;
        segments.push({
          x1: state.x,
          y1: state.y,
          x2: nx,
          y2: ny,
          depth: state.depth,
          isStem: state.depth < 2,
        });
        state = { ...state, x: nx, y: ny };
        break;
      }
      case "+":
        state = { ...state, angle: state.angle + angleRad };
        break;
      case "-":
        state = { ...state, angle: state.angle - angleRad };
        break;
      case "[":
        stack.push({ ...state });
        state = {
          ...state,
          stepLen: state.stepLen * stepScale,
          depth: state.depth + 1,
        };
        break;
      case "]": {
        // place a leaf at the tip of EVERY branch before popping
        leaves.push({ x: state.x, y: state.y, angle: state.angle, depth: state.depth });
        state = stack.pop()!;
        break;
      }
    }
  }

  return { segments, leaves };
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function stemColor(depth: number): string {
  // deeper branches → lighter brown
  const browns = ["#5C3A1E", "#7B4F2E", "#9C6B3C", "#B8895A", "#D4A574"];
  const idx = Math.min(depth, browns.length - 1);
  return browns[idx];
}

function leafColor(depth: number): string {
  const greens = ["#2D6A2D", "#3A8C3A", "#4DAF4D", "#6CC16C", "#8FD98F"];
  // Remove the "- 2" so leaves on the main trunk get the darkest green, 
  // and they get lighter as the branches go outward.
  const idx = Math.min(depth, greens.length - 1); 
  return greens[idx];
}

function stemWidth(depth: number): number {
  const widths = [5, 3.5, 2.5, 1.5, 1];
  return widths[Math.min(depth, widths.length - 1)];
}

// ─── Plant Component ──────────────────────────────────────────────────────────

const CANVAS_W = SCREEN_WIDTH;
const CANVAS_H = SCREEN_HEIGHT * 0.85;

export default function LSystemPlant() {
  const { segments, leaves } = useMemo(() => {
    const lstring = expand(AXIOM, RULES, ITERATIONS);
    return interpret(
      lstring,
      CANVAS_W / 2,
      CANVAS_H - 40,
      ANGLE_DEG,
      STEP_LENGTH * (CANVAS_H / 400),
      1 / STEP_SCALE
    );
  }, []);

  // Group segments by depth for batched path drawing
  const stemPaths = useMemo(() => {
    const groups: Record<number, { path: ReturnType<typeof Skia.Path.Make>; depth: number }> = {};
    for (const seg of segments) {
      if (!groups[seg.depth]) {
        groups[seg.depth] = { path: Skia.Path.Make(), depth: seg.depth };
      }
      const p = groups[seg.depth].path;
      p.moveTo(seg.x1, seg.y1);
      p.lineTo(seg.x2, seg.y2);
    }
    return Object.values(groups);
  }, [segments]);

  // Build leaf paths
  const leafPaths = useMemo(() => {
    const groups: Record<number, { path: ReturnType<typeof Skia.Path.Make>; depth: number }> = {};
    for (const leaf of leaves) {
      if (!groups[leaf.depth]) {
        groups[leaf.depth] = { path: Skia.Path.Make(), depth: leaf.depth };
      }
      const size = Math.max(3, 10 - leaf.depth * 1.5);
      const p = groups[leaf.depth].path;

      // Small teardrop/ellipse leaf rotated to branch angle
      const cosA = Math.cos(leaf.angle - Math.PI / 2);
      const sinA = Math.sin(leaf.angle - Math.PI / 2);

      // Leaf as a simple oval, rotated by angle
      const lx = leaf.x;
      const ly = leaf.y;
      // Approximate oval with bezier
      const hw = size * 0.55;
      const hh = size;

      // tip and base of leaf in local space, then rotate
      const tipLocal = { x: 0, y: -hh };
      const baseLocal = { x: 0, y: hh * 0.3 };
      const leftLocal = { x: -hw, y: 0 };
      const rightLocal = { x: hw, y: 0 };

      const rotate = (pt: { x: number; y: number }) => ({
        x: lx + pt.x * cosA - pt.y * sinA,
        y: ly + pt.x * sinA + pt.y * cosA,
      });

      const tip = rotate(tipLocal);
      const base = rotate(baseLocal);
      const left = rotate(leftLocal);
      const right = rotate(rightLocal);

      p.moveTo(base.x, base.y);
      p.cubicTo(left.x, left.y, tip.x, tip.y, tip.x, tip.y);
      p.cubicTo(tip.x, tip.y, right.x, right.y, base.x, base.y);
      p.close();
    }
    return Object.values(groups);
  }, [leaves]);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Stem / branch paths */}
        {stemPaths.map(({ path, depth }) => (
          <Path
            key={`stem-${depth}`}
            path={path}
            color={stemColor(depth)}
            style="stroke"
            strokeWidth={stemWidth(depth)}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}

        {/* Leaf paths */}
        {leafPaths.map(({ path, depth }) => (
          <Path
            key={`leaf-${depth}`}
            path={path}
            color={leafColor(depth)}
            style="fill"
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0E8",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
  },
});