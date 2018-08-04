/** Parse an object
 *
 * The input value needs to be in a form that the
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object Object object}
 *
 * @memberof Formatters
 * @param {object} object - Object to search trough
 * @param {string} keys - List of the keys to reach separate with '.'
 *
 * @example
 * var mf = new MessageFormat(['en', 'fi']);
 *
 * mf.compile('The key name of the object people is {people, keys, name}')({ people: { name: 'Bastian'}})
 * // 'The key name of the object people is Bastian'
 *
 * mf.compile('{game, keys, player.name} is level {game, keys, player.level}')({ game: { player: {level: 42, name: Kirby}}})
 * // 'Kirby is level 42'
 *
 */

function keys(object,lc,keys) {
    const args = keys.split('.');
    for (arg of args) {
        object = object[arg];
    }
    return object
}

module.exports = function () { return keys; }
