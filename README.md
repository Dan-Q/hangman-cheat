# Cheatman

A game of hangman that cheats while keeping its lies internally-consistent.

## How To Play

Play at [cheatman.danq.me](https://cheatman.danq.me/). Guess letters to see if you can
find the word

The default configuration, which you can change on the fly using checkboxes, is:

* *Cheat mode on*: turn it off to disallow the computer from cheating i.e. make it
  into a normal game of Hangman. Doing this selectively i.e. mid-game can provide 
  insights into how it works.
* *Transparent cheating on*: when the computer cheats, it'll tell you so. Turn this
  off to make the game _feel_ like it's fair (but difficult).
* *Ghost mode off*: Turning on ghost mode will allow you to see, faintly in the
  boxes, the word that the computer is thinking of. It'll change it's mind as you
  guess (if cheat mode is on), of course: turning this on is a great way to see how
  it works.

You can download the [full source](https://github.com/dan-q/hangman-cheat) and run it
on any web server (it can't be run from file:// URLs because it uses the Fetch API to
download the wordlist).

## History

In 2012, the inimitable [Nick Berry](http://datagenetics.com/) derived the
[optimal strategy for playing Hangman](http://datagenetics.com/blog/april12012/index.html); 
that is, for the English language, the optimal letters you should choose for any given
word length; his approach can easily be extended to suggest the optimal letters for any
given game state (e.g. "having a word of this length and having guessed these letters
and found them to be in those positions, what should I guess next").

In 2013, I adapted this approach to determine
[the hardest words to guess at Hangman](https://danq.me/2013/12/15/hangman/). In other
words: if you know that your opponent will be playing optimally, which words should
you choose from in order to maximise the number of guesses the player has to make
before they get it. Naturally, this doesn't work as well against a "smart" player who
knows that you're trying to catch them out, but it could probably be expanded into
a strategy that selectively chooses "hard" words at rate appropriate to the expected
suspicion level of the player guessing.

## How It Works

This new project, though, goes in another direction: this hangman _cheats_! Every time
a letter is guessed, the game considers all of the words that it could _possibly_ have
chosen that are consistent with the statements it's made so far about the length of
the word, the number and position of correctly-guessed letters, and the identity of
incorrectly-guessed letters. And then, if applicable, it changes the word it was
thinking of in order to maximise the expected search space, i.e. to make it as hard
as possible for you to guess the word.

Read my blog post about it at https://danq.me/2019/09/26/cheatman/.

## Development/Future

You'll find a stack of constants at the top of `cheat.js` which configure how the
game behaves, e.g. you can tweak the threshold (number of possible remaining words)
at which it starts to cheat in order to balance the strength of cheating against the
performance of the game (it's not fast!).

I'm considering adding "friendly" features like a PWA manifest (making it "installable"),
prettier UI, varied output messages, sound effects (possibly even voice?), etc. But I'm
in no hurry, and I'm happy to consider pull requests from anybody who's got more
time/energy than I.

## Author

* [Dan Q](https://danq.me/)

## License

This program is free software: you can redistribute it and/or modify it under the terms
of the Affero GNU General Public License.

This project includes a dictionary (`wordlist.txt`) which is in the public domain.
