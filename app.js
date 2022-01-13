const fs = require('fs');

const rawdata = fs.readFileSync('words.txt', 'utf8');
const allWords = rawdata.split("\n")

function letterStats(words, zeroweights = []) {
  const letterMix = words.flatMap((w) => w.split("").filter(onlyUnique))
  const counts = {};
  for (const num of letterMix) {
    counts[num] = counts[num] ? counts[num] + 1 : 1;
  }
  zeroweights.forEach(l => counts[l] = 0)
  const sorted = Object.fromEntries(
    Object.entries(counts).sort(([,a],[,b]) => b-a)
  )

  //console.log(sortable);
  //console.log(JSON.stringify(sorted))
  return sorted
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function scoreWordByLetterUsage(words, stats) {
  const scores = Object.assign(
    {},
    ...words.map((w) => { return {[w]: w.split("").filter(onlyUnique).reduce(((p, c) => p + (stats[c] ? stats[c] : 0)), 0)}})
  )
  //console.log(scores)
  const sorted = Object.fromEntries(
    Object.entries(scores).sort(([,a],[,b]) => b-a)
  )
  return sorted
}

function filterWords(fix, contains, notContains) {
  const possibleWords = allWords
    .filter((w) => contains.every(r=> w.split("").includes(r)))
    .filter((w) => !w.split("").some(r=> notContains.includes(r)))
    .filter((w) => {
      const warr = w.split("")
      return Object.entries(fix).every(e => warr[e[0]] === e[1])
    })

  return possibleWords;
}

function gameStep(guess, solution) {
  const garr = guess.split("")
  const sarr = solution.split("")
  let fix = {}
  let contains = []
  let notContains = []
  garr.forEach((l, i) => {
    if(sarr.indexOf(l) >= 0) {
      contains.push(l)
      if(garr[i] === sarr[i]) {
        Object.assign(fix, {[i]:l})
      }
    } else {
      notContains.push(l)
    }
  })
  return {
    fix,
    contains,
    notContains
  }
}

//console.log(filterWords({1: "a"}, ["a", "b"], []).length)
//console.log(filterWords({}, ["a", "b"], ["e"]).length)

//console.log(filterWords({0: "t"}, ["t", "e", "s", "e"], ["h"]))
//console.log(filterWords({0: "t"}, [], ["h"]))

//console.log(gameStep("abuse", "tests"))
//console.log(gameStep("abuse", "about"))

function playOneGame(solution, guesses, gameRes, silent = true) {
  silent || console.log("=========================")
  silent || console.log(guesses)
  const words = filterWords(gameRes.fix, gameRes.contains, gameRes.notContains)

  const letters = letterStats(words, gameRes.contains.concat(gameRes.notContains))
  silent || console.log(Object.entries(letters).slice(0, 10))
  const newGuessesPro = scoreWordByLetterUsage(words, letters)
  const newGuessesCon = scoreWordByLetterUsage(allWords, letters)

  silent || console.log(Object.entries(newGuessesPro).slice(0, 5))
  silent || console.log(Object.entries(newGuessesCon).slice(0, 5))

  let newGuess = Object.keys(newGuessesPro)[0]
  if(newGuessesPro[Object.keys(newGuessesPro)[0]] < newGuessesCon[Object.keys(newGuessesCon)[0]]){
    if(Object.keys(newGuessesPro).length > 3) {
      newGuess = Object.keys(newGuessesCon)[0]
    }
  } else {
    const equals = Object.entries(newGuessesPro).filter(([,s]) => s === newGuessesPro[newGuess]).map(([k,]) => k)
    newGuess = equalTactics(guesses, gameRes, equals, silent)
  }

  if(guesses.indexOf(newGuess)>=0) {
    guesses.push(newGuess)
    console.log(solution + " err")
    return guesses
  } else if(newGuess === solution) {
    guesses.push(newGuess)
    return guesses
  } else {
    guesses.push(newGuess)
    const newRes = gameStep(newGuess, solution)
    Object.assign(newRes.fix, gameRes.fix)
    newRes.contains.push(...gameRes.contains)
    newRes.contains = newRes.contains.filter(onlyUnique)
    newRes.notContains.push(...gameRes.notContains)
    newRes.notContains = newRes.notContains.filter(onlyUnique)
    silent || console.log(newRes)
    return playOneGame(solution, guesses, newRes, silent)
  }
}

function equalTactics(guesses, gameRes, equals, silent = true) {
  const badPos = {}
  guesses.forEach(w =>
    w.split("").forEach((l, i) => {
      if(!gameRes.fix[l]) {
        badPos[i] = badPos[i] ? badPos[i].concat([l]) : [l];
      }
    })
  )

  const scores = Object.assign(
    {},
    ...equals.map(w => ({[w]: w.split("").reduce((p, c, i) => p + (badPos[i] && badPos[i].indexOf(c) >= 0 ? 1 : 0), 0)}))
  )
  const sorted = Object.fromEntries(
    Object.entries(scores).sort(([,a],[,b]) => a-b)
  )

  silent || console.log(sorted)

  return Object.keys(sorted)[0]
}

const startingGameState = {
  fix: {},
  contains: [],
  notContains: []
}

//console.log(playOneGame("abbey", [], startingGameState))
//console.log(playOneGame("tests", [], startingGameState))

const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
const max = arr => arr.reduce((a,b) => a > b ? a : b, 0);


function run() {
  const algoRes = allWords.map(w => ({[w]: playOneGame(w, [], startingGameState)}))
  fs.writeFileSync( "result.json", JSON.stringify(algoRes) )
}


function results() {
  const rawres = fs.readFileSync('result.json', 'utf8');
  const parsed = JSON.parse(rawres)

  const merged = Object.assign({}, ...parsed)
  const guessNbrs = Object.entries(merged).map(([, arr]) => arr.length)
  console.log(average(guessNbrs))
  console.log(max(guessNbrs))

  const sorted = Object.entries(merged).sort(([, a], [, b]) => b.length - a.length)
  //console.log(sorted.slice(0, 10))
  const group = {}
  Object.entries(merged).forEach(([k, v]) =>
    group[v.length] = group[v.length] ? group[v.length].concat([k]) : [k]
  )
  //console.log(group)
  console.log(Object.entries(group).map(([k, v]) => ({[k]: v.length})))

}

//console.log(playOneGame("notes", [], startingGameState, false))
//run()
//results()
