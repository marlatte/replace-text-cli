# Replace Text CLI

A text replacement command line utility with dry-run, mapping, and regex support.

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

- Input: path to the starting text that will be replaced, either by copy or in-place
- Map: path to the list of rules mapping inputs to outputs
  - Must be a `.txt` file
  - Rules must follow the format: `input => output`
- Output: path to where the results will be written. Users are given the option to overwrite the input file or create a new one.

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

The `--in` and `--map` options each require a value, but with `--out`, it's optional.

**▲ Warning: Using `--out` with no value overwrites the input file, so use with caution ▲**

### Dry run

Highly recommended!!

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

Copy the command after `Simulating...` and paste it into the terminal to run the full program with the same options.

### Help

```bash
replace-text -h
```

## Map files

Map files must have a `.txt` extension, and rules must have an input and an arrow. The output value is optional (if you want to remove text). Inputs can be strings or regular expressions (Regex), and `#` comments are allowed.

### Example

```text title="map.txt"
# map.txt

# Replace all instances of "Michael" with "John"
Michael => John

# Replace all numbers with the letter "X"
/\d/g => X

# Remove all instances of "ultimately,"
/ultimately,/i =>
```
