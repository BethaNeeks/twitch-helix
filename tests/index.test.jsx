import TwitchHelix from "../src/index"

require("dotenv").config()

const clientId = process.env.TWITCH_CLIENT_ID
const clientSecret = process.env.TWITCH_CLIENT_SECRET

let twitchApi = null

beforeAll(() => {
    twitchApi = new TwitchHelix({clientId, clientSecret})
    twitchApi.on("log-warn", console.log)
    twitchApi.on("log-error", console.error)
})

test("TwitchHelix construction and authorize() working", async () => {
    expect(typeof twitchApi).toBe("object")
    const tokenExpiration = await twitchApi.authorize()
    expect(tokenExpiration).toBeGreaterThan(Date.now())
})

test("getTwitchUser*", async () => {

    let loggingEventCalls = 0
    twitchApi.on("log-info", () => loggingEventCalls++)

    const user = await twitchApi.getTwitchUserByName("nightbot")
    expect(user.description).toMatch("A chat moderator bot")
    expect(user.display_name).toMatch("Nightbot")
    expect(user.id).toBe("19264788")
    expect(user.login).toBe("nightbot")
    expect(user.offline_image_url).toMatch("https://")
    expect(user.profile_image_url).toMatch("https://")
    expect(user.view_count).toBeGreaterThan(0)

    const twitchUsers = await twitchApi.getTwitchUsersByName(["gronkh", "xpandorya"])
    expect(twitchUsers).toHaveLength(2)
    const [gronkh, pandorya] = twitchUsers // Guessing that getTwitchUsersByName returns array values in the same order as its argument (not confirmed)
    expect(gronkh.id).toBe("12875057")
    expect(pandorya.id).toBe("35893764")

    expect(loggingEventCalls).toBeGreaterThanOrEqual(2)

})

test("getFollowDate", async () => {
    const [gronkh, pandorya] = await twitchApi.getTwitchUsersByName(["gronkh", "xpandorya"])
    const followDate = await twitchApi.getFollowDate(gronkh.id, pandorya.id)
    expect(followDate.getFullYear()).toBe(2014) // Bravely assuming that xPandorya never unfollows Gronkh
})

test("getStreamInfo*", async () => {
    const offlineStreamInfoById = await twitchApi.getStreamInfoById("19264788") // Nightbot (I hope that Night never starts streaming on this account)
    expect(offlineStreamInfoById).toBeNull()
    const offlineStreamInfoByUsername = await twitchApi.getStreamInfoByUsername("nightbot")
    expect(offlineStreamInfoByUsername).toBeNull()
})

test("getClipById", async () => {
    const clipInfo = await twitchApi.getClipById("CrunchyTolerantSharkThunBeast")
    expect(clipInfo.id).toBe("CrunchyTolerantSharkThunBeast")
    const badClipInfo = await twitchApi.getClipById("somethingthatwontbethere")
    expect(badClipInfo).toBeNull()
})

test("getClipsByIds", async () => {
    const clipsInfo = await twitchApi.getClipsByIds(["CrunchyTolerantSharkThunBeast", "WildAntediluvianAyeayeAMPTropPunch"])
    expect(clipsInfo).toHaveLength(2)
    expect(clipsInfo[0].id).toBe("CrunchyTolerantSharkThunBeast")
    expect(clipsInfo[1].id).toBe("WildAntediluvianAyeayeAMPTropPunch")
})

test("TwitchHelix should throw an Error if incorrectly constructed", () => {
    expect(() => new TwitchHelix()).toThrow("needs options object")
    expect(() => new TwitchHelix({clientId}).toThrow("TwitchHelix option clientSecret"))
    expect(() => new TwitchHelix({clientId, clientSecret: "xxx"}).toThrow("Option clientSecret is xxx which looks like a placeholder value"))
})
