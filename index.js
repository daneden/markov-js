// fs allows us to read files from the disk
const fs = require("fs")

// our text sample will be read from this file
const text = fs.readFileSync("./tweets.txt").toString()

// define some sentence separators
const seps = /[.!?;:]/

/**
 * sample is a function that picks a random element from an array
 * @param {any[]} arr
 */
function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

class MarkovChain {
  /**
   * @param {number} order
   */
  constructor(order) {
    /**
     * "order" is the "memory" of the Markov chain. For example, with
     * an order of 2, the likelihood of a word appearing is based on the
     * previous 2 words
     * @type {number}
     */
    this.order = order

    /**
     * The array storing all the beginnings of sentences in our text sample.
     * One of these will be chosen at random to start the generated sentence.
     * @type {string[][]}
     */
    this.beginnings = []

    /**
     * A dictionary of frequencies for different word combinations. Each key
     * is a sentence fragment of `order` length, and the value is an array of
     * words that come after that sentence fragment.
     */
    this.freq = {}
  }

  /**
   * Adds a sentence to the chain. This adds the beginning of the sentence to
   * this.beginnings and adds frequencies/probabilities to this.freq
   * @param {string} string
   */
  addSentence(string) {
    // split the passed sentence into words and filter out excess spaces/empty slots
    const words = string
      .split(" ")
      .filter(s => s !== "'")
      .filter(s => s !== " ")
      .filter(s => s !== "")

    /**
     * Initialise a buffer. This buffer will be moved along the sentence kind
     * of like a filmstrip, looking at only `order + 1` words at a time:
     *
     * This is [a sentence with] the buffer illustrated
     *
     */
    const buf = []

    // If the sentence is shorter than the order then we must return
    if (words.length <= this.order) {
      return
    }

    // Add the beginning of this sentence to the chain's beginnings
    this.beginnings.push(words.slice(0, this.order + 1))

    for (let word of words) {
      buf.push(word)
      if (buf.length === this.order + 1) {
        const key = `${buf[0]} ${buf[buf.length - 2]}`
        if (this.freq.hasOwnProperty(key)) {
          this.freq[key].push(buf[buf.length - 1])
        } else {
          this.freq[key] = [buf[buf.length - 1]]
        }

        /**
         * Remove the first word from the beginning of the array to move
         * the buffer forward
         */
        buf.splice(0, 1)
      }
    }
  }

  /**
   * Runs through the Markov chain to generate a sentence
   */
  generateSentence() {
    // Sample the beginnings and make a copy to begin our sentence.
    const sentence = sample(this.beginnings).slice()

    // Choose a random fragment of puncutation to end the sentence with.
    const terminal = sample([".", "!", "?"])

    // Set a flag for us to check when we've exhausted our sentence options.
    let done = false

    while (!done) {
      // Pick the two most recent words
      const words = [
        sentence[sentence.length - 2],
        sentence[sentence.length - 1],
      ]

      // Grab the next word following the previous two
      const nextWord = this.nextWordFor(words)

      if (!nextWord.done) {
        // If the sentence isn't finished, push the result to the end of the sentence
        sentence.push(nextWord.word)
      } else {
        // Otherwise, we're finished!
        done = true
      }
    }

    // Return the completed sentence.
    return sentence.join(" ") + terminal
  }

  /**
   * nextWordFor takes two words and returns the next word (chosen at random, with
   * more-commonly appearing words being more likely to be chosen)
   *
   * @param {string[]} words
   */
  nextWordFor(words) {
    const [a, b] = words
    const key = `${a} ${b}`
    if (this.freq.hasOwnProperty(key)) {
      return {
        word: sample(this.freq[key]),
        done: false,
      }
    } else {
      return {
        done: true,
      }
    }
  }

  addText(text) {
    const sentences = String(text)
      // strip newlines
      .replace(/\n/g, " ")
      // split into sentences
      .split(seps)
      // filter out empty strings
      .filter(e => e !== "")

    for (let sentence of sentences) {
      this.addSentence(sentence)
    }
  }

  sampleFrequencies() {
    const key = sample(Object.keys(this.freq))

    return `${key}: ${this.freq[key]}`
  }

  getLongestChain() {
    const values = Object.values(this.freq).sort((a, b) => b.length - a.length)
    const key = Object.keys(this.freq).find(k => this.freq[k] === values[0])
    let v = {}

    v[key] = values[0]

    return v
  }

  getFrequencies() {
    return this.freq
  }

  getBeginnings() {
    return this.beginnings
  }
}

const chain = new MarkovChain(2)

chain.addText(text)
console.log(chain.generateSentence())

// const saidThe = chain
//   .getLongestChain()
//   ["said the"].map(s => s.replace(",", ""))
//   .reduce((results, curr) => {
//     if (results && results.hasOwnProperty(curr)) {
//       results[curr]++
//     } else {
//       results[curr] = 1
//     }

//     return results
//   }, {})

// console.log(saidThe)
