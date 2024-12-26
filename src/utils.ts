import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const idsFilePath = path.join(__dirname, "../", "ids.json");

const marvelRanks = [
  "One Above All",
  "Eternity",
  "Grandmaster 1",
  "Grandmaster 2",
  "Grandmaster 3",
  "Diamond 1",
  "Diamond 2",
  "Diamond 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Silver 1",
  "Silver 2",
  "Silver 3",
  "Bronze 1",
  "Bronze 2",
  "Bronze 3",
];

const rankToIndex = new Map(marvelRanks.map((rank, index) => [rank, index]));

export function cleanScore(score: string): number {
  return parseInt(score.replace(/[^0-9]/g, ""), 10);
}

export function compareRanks(
  rankA: string,
  scoreA: string,
  rankB: string,
  scoreB: string
): number {
  const cleanScoreA = cleanScore(scoreA);
  const cleanScoreB = cleanScore(scoreB);

  return cleanScoreB - cleanScoreA;
}

export const getURL = (id: string) =>
  encodeURI(`https://rivalsmeta.com/player/${id}`);

export function getMedalForRank(index: number): string {
  switch (index) {
    case 0:
      return "🥇"; // Gold medal
    case 1:
      return "🥈"; // Silver medal
    case 2:
      return "🥉"; // Bronze medal
    default:
      return " " + (index + 1).toString();
  }
}

export type Player = {
  rank: string;
  path: string;
  id: string;
  name: string;
  games: string;
  mostPlayedHero: string;
  score: string;
};

export function createLeaderboardEmbed(data: Player[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("Leaderboard Marvel Rivals - by Henri")
    .setColor("#FFD700"); // Set a default color

  embed.setDescription(
    "use /add <id> <name> to add your ID to the leaderboard"
  );

  embed.addFields({
    name: `#`,
    value: data.map((_, index) => getMedalForRank(index)).join("\n"),
    inline: true,
  });

  embed.addFields({
    name: `ID / Name`,
    value: data
      .map((entry) => {
        return `[${entry.name}](${getURL(entry.id)})`;
      })
      .join("\n"),
    inline: true,
  });

  embed.addFields({
    name: `Rank`,
    value: data
      .map((entry) => {
        return `${entry.rank} - ${cleanScore(entry.score).toLocaleString()} (${
          entry.games
        })`;
      })
      .join("\n"),
    inline: true,
  });

  embed.setTimestamp(new Date());

  return embed;
}

export async function compressImage(filePath: string): Promise<void> {
  const outputPath =
    filePath.substring(0, filePath.length - 4) + "_compressed.png";
  let quality = 20;

  const originalImage = sharp(filePath);

  const metadata = await originalImage.metadata();

  const newWidth = Math.round((metadata.width ?? 0) * 0.7);
  const newHeight = Math.round((metadata.height ?? 0) * 0.7);

  await sharp(filePath)
    .resize(newWidth, newHeight)
    .png({ quality, compressionLevel: 9 }) // PNG does not have a quality setting; here it’s for consistency
    .toFile(outputPath);

  fs.unlinkSync(filePath); // Delete the original image
}

export async function setIds(ids: string[]): Promise<void> {
  const removeDuplicate = new Set(ids);

  fs.writeFileSync(
    idsFilePath,
    JSON.stringify([...removeDuplicate], null, 2),
    "utf-8"
  );
}
