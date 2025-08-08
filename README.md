# Replace Text CLI

A text replacement command line utility with dry-run, mapping, and regex support.

```css
/* input.css */
.error {
  color: red;
}

/* map.txt */
red => var(--color-red-500)

/* output.css */
.error {
  color: var(--color-red-500);
}
```

## Features

- Multi-rule mapping
- Regex support
- Dry run

## Install

```bash
npm install -g replace-text-cli
```

## Usage

```bash
replace-text [options]
```

Running the command with no options starts the interactive mode, which asks a series of questions about which files to use. Tab completion is available.

- Input: path to the starting text that will be replaced
- Map: path to the list of rules mapping inputs to outputs
  - Must be a `.txt` file
  - Rules must follow the format: `input => output`
  - See more at [Map files](#map-files)
- Output: path to where the results will be written.
  - Users are given the option to overwrite the input file or create a new one.

### Without options

```console
$ replace-text
  ◆  Where is the text to modify? examples/
    examples/output-files/
  ❯ examples/input.js
    examples/map.txt
  (Use arrow keys to reveal more choices)
```

### With options

Passing options in the command skips the respective questions. For example:

```bash
replace-text --in path/to/input.js
```

This would skip the first question and use `path/to/input.js` as the input file.

Both `--in` and `--map` require a value, but `--out` can be passed without one if you're sure you don't want a separate output file.

> [!CAUTION]
> If you use `--out` without providing a value, it will **overwrite** the input file. Use this with caution.

## Help

For more information on passing options to the program, use the help option.

```bash
replace-text -h
```

## Dry run

🚨 **Highly recommended** 🚨

`replace-text --dry-run` (alias `-d`) prints a short sample of the output instead of writing it to a file. Either mode will print a verbose version of the command before running:

```console
$ replace-text --dry-run

...(program asks questions)...

Simulating...
> replace-text --in=input.css --map=map.txt --out=path/to/output.css

◇  Replacing text from path/to/input.css
│
├─ Writing to path/to/output.css
│
├─ Sample output:
│
│ .error {
│   border: var(--color-red-200);
│   color: var(--color-red-500)
│ }
│
└──◆
```

> [!TIP]
> Copy the command after `Simulating...` and paste it into the terminal to run the full program with the same options.

## Map files

Map files must have a `.txt` extension. Inline and standalone comments are marked with `#`.

Map rules should follow the format: `input => output`, where `input` is the string or regex to match, and `output` is what it will be replaced with. If you want to remove text, leave the output blank.

> [!IMPORTANT]
> Each rule **MUST** have an `input` value and an arrow _preceded by a space_ (` =>`).

Regex patterns must be wrapped in slashes, e.g. `/<pattern>/[flags]`

### Example `map.txt`

```text title="map.txt"
# Replace all instances of "Michael" with "John"
Michael => John

# Replace all numbers with the letter "X"
/\d/g => X

# Remove all instances of "ultimately," case-insensitive
/ultimately,/i =>

# This is a comment
Rjinswand => Rincewind # This is an inline comment
```

## Escaping

If you need to use characters that have meaning in a map file, there are different ways of escaping them, depending on whether they're in the `input` or `output` side of the rule.

These characters include:

- An arrow `'=>'`
- A hashtag `'#'`
- A space character `' '`, which normally gets trimmed

### Inputs

Generally, anything that's an `input` can be escaped with regex. For example, if you need to replace the hashtag in `'#25'` with `'No.25'`, you would use the rule:

```text
/#/ => No.
```

### Outputs

Using a reserved character in an `output` is more nuanced.

#### Arrows: =>

Arrows as rule delimiters need to be preceded by a space (`' =>'`) , so putting any character before it escapes that (`' \=>'`).

If your `output` needs to have an arrow with a space before it, like if you're turning some text into replacement rules that can be used with this program, this rule with regex capture groups and an escaped space `\s` before the output arrow would do the trick:

```js
// input.css
--primary: #16bedc;

// map.txt
/(--[\w-]+): (#[a-z0-9]{3,});/g => $2\s=> var($1)

// output.txt
#16bedc => var(--primary)
```

#### Hashtags: \#

Inline comments require spaces to either side of the hashtag, eg. `' # '`, so the rule `'No. => #'` will work, but `'No. => # '` (with an extra space at the end) will not.

> [!NOTE]
> See more [examples in this file](examples/color-to-var-map.txt), or [check out our tests](test/utils/replace.test.ts) for edge cases. Note that tests use double escapes (`'\\s'`), while files only need singles (`'\s'`). You will probably only need singles.

## Contributing

Found a bug, have an idea, or want to improve the docs? Open an issue or send a PR — contributions of all sizes are welcome!
