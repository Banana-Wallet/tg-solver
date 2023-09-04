const createBigram = word => {
    const input = word.toLowerCase();
    const vector = [];
    for (let i = 0; i < input.length; ++i) {
      	vector.push(input.slice(i, i + 2));
    }
    return vector;
};

export const checkSimilarity = (word1, word2) => {
    if (word1.length > 0 && word2.length > 0) {
        const aBigram = createBigram(word1);
        const bBigram = createBigram(word2);
        let hits = 0;
        for (let x = 0; x < aBigram.length; ++x) {
            for (let y = 0; y < bBigram.length; ++y) {
                if (aBigram[x] === bBigram[y]) {
                    hits += 1;
                }
          	}
        }
        if (hits > 0) {
          	const union = aBigram.length + bBigram.length;
        	return (2.0 * hits) / union;
        }
    }
    return 0;
};

