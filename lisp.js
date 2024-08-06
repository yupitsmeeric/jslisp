
/* Token classes */

class Token {
  constructor(value) {
    this.value = value;
  }

  pretty(indent = 0){}
}

class List extends Token {
  constructor(value) {
    super(value)
    this.kind = "list"
  }

  pretty(indent = 0){
    let res = " ".repeat(indent) + "(\n"
    this.value.forEach((element) => {
      console.log(element);
      res += (element.pretty(indent+2))
    })
    res +=  " ".repeat(indent) + ")\n";

    return res;
  }
}

class Quote extends Token{
  constructor(token) {
    super(token)
    this.kind = "quote"
  }
  
  pretty(indent = 0){
    let res = " ".repeat(indent) + "'" + this.kind + ": " + this.value.pretty() + "\n";
    return res
  }
}

class Symbol extends Token{
  constructor(value) {
    super(value)
    this.kind = "symbol"
  }


  pretty(indent = 0){
    let res = " ".repeat(indent) + this.kind + ": " + this.value + "\n";
    return res
  }
}

class Integer extends Token {
  constructor(value) {
    super(value)
    this.kind = "integer"
  }

  pretty(indent = 0){
    let res = " ".repeat(indent) + this.kind + ": " + this.value + "\n";
    return res
  }
}

class Bool extends Token {
  constructor(value) {
    super(value)
    this.kind = "boolean"
  }

  pretty(indent = 0){
    let res = " ".repeat(indent) + this.kind + ": " + this.value + "\n";
    return res
  }
}

/* Lexer helpers */
function is_whitespace (c) {
  return c === ' ' || c === "\t" || c === "\n";
}

function is_delimeter (c) {
  return is_whitespace(c) || "(){};".includes(c);
}

function is_digit(char) {
    return char.length === 1 && char.charCodeAt(0) >= 48 && char.charCodeAt(0) <= 57;
}


function read_list(input, start) {
  const tokens = []
  let i = start+1;
  while (i< input.length){
    // eat whitespace
    if (is_whitespace(input[i])) {
      i++;
      continue;
    }
    if (input[i] == ")") {
      // return [tokens, i+1]
      i++; // skip the 
      break;
    }
    // read the next token
    const token = read_sexp(input, i);
    tokens.push(token[0]);
    i = token[1];
  }
  const list = new List(tokens);
  return [list, i];

}

function read_symbol(input, start) {
  let i;
  for (i = start+1; i < input.length; i++){
    if ( is_delimeter(input[i]) ) {
     break; 
    }
  }
  const symbol = new Symbol(input.slice(start, i));
  return [symbol, i];
}

function read_integer(input, start) {
  let i;
  for (i = start+1; i < input.length; i++){
    if ( !is_digit(input[i]) ) {
     break; 
    }
  }
  const symbol = new Integer( Number(input.slice(start, i)) );
  return [symbol, i];
}

function read_bool(input, start) {
  let symbol;
  if (input[start+1] == "t") {
  symbol = new Bool( true );
  } else {
  symbol = new Bool( false );
  }
  return [symbol, start+2];
}

/* MAIN LEX FUNCTIOn */
function read_sexp (input, start) {
    /*
    Lexes input one by one
    Split string into array and use a for loop to 
    traverse the string till the end
    */ 
  // tokens = [];
  let token;
  let i = start;
  while(i<input.length){
    // eat whitespace
    if (is_whitespace(input[i])) {
      i++;
      continue;
    }
    
    // read list
    if (input[i] == "("){ //List
      token = read_list(input, i);
      break;
    }else if (is_digit(input[i])) { // Integer
      token = read_integer(input, i)
      break;
    } else if (input[i] == "#"){ // boolean
      token = read_bool(input, i);
      break;
    }
      else if(input[i] == "'"){
        token = read_sexp(input, i+1);
        token[0] = new Quote(token[0]);
        break;
    } else {
      token = read_symbol(input, i)
      break;
    }
    // tokens.push(token[0]);
    // console.log(token[1])
    // i = token[1]
  }
    return token;
    
}


/* AST classes */

class ASTNode{
  constructor(token){}
}

class DefExp extends ASTNode{
  constructor(list){
    super(list);
    this.kind = "defexp"
    if (list.value.length != 3 || list.value[1].kind != "symbol") {
      throw "ParseError: (val name exp)"
    }
    this.name = list.value[1];
    this.exp = build_ast(list.value[2]);
  }

  pretty(indent = 0){
    return " ".repeat(indent) + "val " + this.name + this.exp.pretty(indent+2)+ "\n";
  }
}

class CallExp extends ASTNode{
  constructor(list){
    super(list);
    this.kind = "callexp"
    if (list.value[0].kind != "symbol") {
      throw "ParseError: (fn args...)"
    }
    this.fn = list.value[0];
    this.args = list.value.slice(1,);
  }

  pretty(indent=0){
    return " ".repeat(indent) + fn + " " + this.args.pretty(indent+2) + "\n";
  }
}

class BinOpExp extends ASTNode{
  constructor(list){
    super(list);
    this.kind = "binop"
    if (list.value.length != 3) {
      throw "ParseError: (BINOP a b)"
    }
    this.op = list.value[0].value;
    this.left = build_ast( list.value[1] );
    this.right = build_ast( list.value[2] );
  }

  pretty(indent=0){
    return " ".repeat(indent) + this.left.pretty(indent+2) + this.op + this.right.pretty(indent+2);
  }
}

class IfExp extends ASTNode{
  constructor(list){
    super(list);
    this.kind = "ifexp"
    if (list.value.length != 4) {
      throw "ParseError: (if cond iftrue iffalse)"
    }
    this.cond = build_ast(list.value[1]);
    this.iftrue = build_ast(list.value[2]);
    this.iffalse = build_ast(list.value[3]);
  }

  pretty(indent = 0){
    return " ".repeat(indent) + "if " + this.cond.pretty(indent+2) + " " + 
              this.iftrue.pretty(indent+2) + " else " + this.iffalse.pretty(indent+2)  + "\n";
  }
}
/* PARSER / AST BUILDER */
binops = ["+", "-", "/", "*", "=", ">", "<"]
function build_ast(token){
  if (token.kind != "list") {
    return token;
  }
  // check the first thing in the list
  if ( binops.includes(token.value[0].value) ){
    return new BinOpExp(token);
  }
  switch (token.value[0].value){
    case "val": 
      return new DefExp(token);
    case "if":
      return new IfExp(token);
    default: 
      return new CallExp(token);

  }
}

/* ENVIRONMENT */
class Environment{
  constructor(child){
    this.child = child
    this.env = new Map();
  }

  bind(name, value){
    this.env.set(name.value, value);
  }

  lookup(name){
    if (this.env.has(name.value)) {
      console.log("found: "+ name.value );
      return this.env.get(name.value);  
    } else if (this.child === null) {
      throw "ValueError: " + name.value + " is undefined";
    } else {
      return this.child.lookup(name);
    }
  }
}

/* EVAL AST */
function eval(ast, env){
  switch (ast.kind){
    case "integer":
      return ast;
    case "boolean":
      return ast;
    case "quote":
      return ast;
    case "symbol":
      return env.lookup(ast);

    case "defexp":
      return eval_defexp(ast, env);
    
    case "ifexp":
      cond = eval(ast.cond, env).value;
      if (cond) {
        return eval(ast.iftrue, env);
      } else {
        return eval(ast.iffalse, env);
      }
    
    case "binop":
      return eval_binop(ast, env);

  }
}

/* eval defexps */
function eval_defexp(ast, env){
  const val = eval(ast.exp, env);
  env.bind(ast.name, val);
  return val;
}

/* Eval Binop */
function eval_binop(ast, env){
  let left = eval(ast.left, env);
  let right = eval(ast.right, env);
  switch (ast.op){
    case "+": 
      return new Integer( left.value + right.value );
    case "-": 
      return new Integer( left.value - right.value );
    case "/": 
      return new Integer( left.value / right.value );
    case "*": 
      return new Integer( left.value * right.value );
    case ">": 
      return new Integer( left.value > right.value );
    case "<": 
      return new Integer( left.value < right.value );
    case "=": 
      return new Integer( left.value == right.value );
    case "+": 
      return new Integer( left.value + right.value );
    default:
      return new Integer(0); 
  }
}

function repl(input, env){
  lex = read_sexp(input, 0);
  // console.log(lex);
  lex = lex[0];
  ast = build_ast(lex);
  // console.log('hi');
  // console.log(lex.pretty());
  let res = eval(ast, env)
  console.log(res.pretty());
  return res;
}

function main(){
  // let i = "hello";
  // let input = "(hello (+ 1 2) #t #f hi test)";
  // let input = "(val a 2)";
  // input = "hello";
  // a = read_sexp(input, 0);
  // let token = a[0];
  // print_sexp(a[0]);
  // console.log(token.pretty());
  // console.log( build_ast(token) );
  // let input = "(if #t (+ 1 (+ 3 3)) 1)"
  let input = "(val a 2)"
  const env = new Environment(null);
  console.log(env);
  repl(input, env);
  console.log(env);
  repl("(+ a a)", env);
}

main();