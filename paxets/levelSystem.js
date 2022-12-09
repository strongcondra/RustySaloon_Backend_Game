var levelMultiplier = 1.2;
var levelStartValue = 100;

module.exports = {
    calcLevel: (xp) => {
        var levelDecimal = Math.log10((((levelMultiplier - 1) * xp) / levelStartValue) + 1) / Math.log10(levelMultiplier);
        var nextLevel = levelStartValue * (Math.pow(levelMultiplier, (Math.floor(levelDecimal))));
        var totalXp = levelStartValue * (Math.pow(levelMultiplier, (Math.floor(levelDecimal) + 1)) - 1) / (levelMultiplier - 1);
        return {
            level: Math.floor(levelDecimal) + 1,
            neededXp: nextLevel,
            xp: nextLevel - Math.floor(totalXp - xp)
        };
    }
}