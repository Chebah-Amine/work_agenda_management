module.exports = function (api) {
    api.cache(true);
    // L'alias "@/..." vient de tsconfig.json (paths) : Expo le résout nativement.
    return {
        presets: ['babel-preset-expo'],
    };
};
