
import { db } from "../server/db";
import { players, teams, tournamentSettings, auctionState } from "../shared/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // 1. Seed Teams
  const defaultTeams = [
      { name: "Mumbai Strikers", shortName: "MS", primaryColor: "#004BA0", secondaryColor: "#D4AF37" },
      { name: "Chennai Warriors", shortName: "CW", primaryColor: "#FFCB05", secondaryColor: "#004BA0" },
      { name: "Bangalore Royals", shortName: "BR", primaryColor: "#EC1C24", secondaryColor: "#000000" },
      { name: "Kolkata Knights", shortName: "KK", primaryColor: "#3A225D", secondaryColor: "#FFD700" },
      { name: "Delhi Capitals", shortName: "DC", primaryColor: "#0078BC", secondaryColor: "#EF1B23" },
      { name: "Hyderabad Sunrisers", shortName: "HS", primaryColor: "#FF822A", secondaryColor: "#000000" },
      { name: "Punjab Kings", shortName: "PK", primaryColor: "#ED1B24", secondaryColor: "#A7A9AC" },
      { name: "Rajasthan Royals", shortName: "RR", primaryColor: "#EA1A85", secondaryColor: "#254AA5" },
      { name: "Gujarat Titans", shortName: "GT", primaryColor: "#1C1C1C", secondaryColor: "#0B4973" },
      { name: "Lucknow Giants", shortName: "LG", primaryColor: "#A72056", secondaryColor: "#FFCC00" },
      { name: "Ahmedabad Eagles", shortName: "AE", primaryColor: "#2E8B57", secondaryColor: "#FFD700" },
      { name: "Jaipur Jaguars", shortName: "JJ", primaryColor: "#FF6347", secondaryColor: "#4169E1" },
  ];

  console.log("Seeding teams...");
  for (const team of defaultTeams) {
    const existing = await db.query.teams.findFirst({
        where: (teams: { name: any; }, { eq }: any) => eq(teams.name, team.name)
    });

    if (!existing) {
        await db.insert(teams).values({
            id: randomUUID(),
            ...team,
            budget: 25000,
            remainingBudget: 25000,
        });
        console.log(`Created team: ${team.name}`);
    } else {
        console.log(`Team already exists: ${team.name}`);
    }
  }

  // 2. Tournament Settings
  console.log("Seeding tournament settings...");
  const settings = await db.query.tournamentSettings.findFirst();
  if (!settings) {
      await db.insert(tournamentSettings).values({
          id: randomUUID(),
          isAuctionOpen: false,
          isRegistrationOpen: true,
          defaultBudget: 25000,
      });
       console.log("Created tournament settings");
  } else {
      console.log("Tournament settings already exist");
  }

    // 3. Auction State
    console.log("Seeding auction state...");
    const auction = await db.query.auctionState.findFirst();
    if (!auction) {
        await db.insert(auctionState).values({
            id: randomUUID(),
            status: "not_started",
            currentCategory: "3000",
        });
        console.log("Created auction state");
    } else {
        console.log("Auction state already exists");
    }


  // 4. Dummy Players
  console.log("Seeding dummy players...");
  const dummyPlayers = [
    {
        name: "Rohit Sharma",
        mobile: "9999999991",
        email: "rohit@example.com",
        address: "Mumbai",
        role: "Batsman",
        battingRating: 95,
        bowlingRating: 60,
        fieldingRating: 90,
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rohit_Sharma_at_press_conference.jpg/640px-Rohit_Sharma_at_press_conference.jpg",
        basePoints: 3000,
        category: "3000",
        approvalStatus: "approved",
    },
     {
        name: "Virat Kohli",
        mobile: "9999999992",
        email: "virat@example.com",
        address: "Delhi",
        role: "Batsman",
        battingRating: 98,
        bowlingRating: 50,
        fieldingRating: 95,
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg",
        basePoints: 3000,
        category: "3000",
         approvalStatus: "approved",
    },
    {
        name: "Jasprit Bumrah",
        mobile: "9999999993",
        email: "bumrah@example.com",
        address: "Ahmedabad",
        role: "Bowler",
        battingRating: 40,
        bowlingRating: 98,
        fieldingRating: 85,
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Jasprit_Bumrah_in_PMO_New_Delhi.jpg",
        basePoints: 2500,
        category: "2500",
         approvalStatus: "approved",
    }
  ];

    for (const player of dummyPlayers) {
        const existing = await db.query.players.findFirst({
            where: (players: { mobile: any; }, { eq }: any) => eq(players.mobile, player.mobile)
        });

        if (!existing) {
             await db.insert(players).values({
                id: randomUUID(),
                ...player,
            });
            console.log(`Created player: ${player.name}`);
        } else {
            console.log(`Player already exists: ${player.name}`);
        }
    }

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
