# Replace Text CLI

A text replacement command line utility with dry-run, mapping, and regex support.

```css
/* Input: */
.error {
  color: red;
}

/* Map rule: */
red => var(--color-red-500)

/* Output: */
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

### Example

```text title="map.txt"
# map.txt

# Replace all instances of "Michael" with "John"
Michael => John

# Replace all numbers with the letter "X"
/\d/g => X

# Remove all instances of "ultimately," case-insensitive
/ultimately,/i =>

# This is a comment
Rjinswand => Rincewind # This is an inline comment
```

### Escaping

If you need to use an arrow (`=>`) or space (`' '`) in your string or regex rules as part of either the `input` or `output`, you'll need to escape them. For example, if you have some text you want to turn into replacement rules so you can run that through this program, meaning the `output` needs to have an arrow with a space in it, use `\s=>`.

See [examples](examples/color-to-var-map.txt) for more.

## Contributing

Found a bug, have an idea, or want to improve the docs? Open an issue or send a PR — contributions of all sizes are welcome!
