import { isLiteral, isVariable, Literal, Variable } from './index';

/** Get a string source identifier for a Literal or Variable `arg`. */
export function getArgSource(arg: Literal | Variable): string {
  if (isVariable(arg)) {
    return (
      '$' +
      arg.var_path
        .map(vp => {
          const str = getArgSource(vp);
          return str[0] === '$' ? `(${str})` : str;
        })
        .join('.')
    );
  }
  return isLiteral(arg) ? String(arg.value) : '???';
}
