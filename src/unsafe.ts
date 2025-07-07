// ❌ Obvious security smell: eval on user data
export function runUserCode(userInput: string) {
  // @ts-ignore
  return eval(userInput);
}
