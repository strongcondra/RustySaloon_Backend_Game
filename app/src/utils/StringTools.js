/**
 * Class used for utils involving strings
 */
class StringTools {
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

export default StringTools;