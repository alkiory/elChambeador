import { render } from "preact";
import { App } from "./App";
import "./styles.css";

const mountNode = document.getElementById("app") ?? document.getElementById("root");
if (mountNode) {
  render(<App />, mountNode);
}