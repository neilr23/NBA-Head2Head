import csv
import json
import numpy as np
from os import path
import sys
import string

# References: https://github.com/tony-mtz/nba-simulation, https://github.com/jaebradley/basketball_reference_web_scraper
class matchSim():
    def __init__(self, t1, t2):
        self.t1 = t1
        self.t2 = t2
        self.score = [0, 0]

    def gameRun(self):
        self.score[0] = self.posSim(40, self.t1)
        self.score[1] = self.posSim(40, self.t2)

    def posSim(self, numPos, team):
        pts = {}
        for i in range(len(team.roster)):
                pts[team.roster[i].name] = 0
        score = 0
        total_tovs = 0
        while numPos > 0:
            tov = team.stats[1]
            result_TOV = np.random.choice([0, 1], p=[1 - (tov / 100), tov / 100])
            if result_TOV == 1:
                total_tovs += 1
                numPos -= 1
                continue
            shooter = team.chooseShooter()
            pname = ''
            ix = -1
            with open('info/players.csv', 'r') as f:
                reader = csv.reader(f, delimiter=',')
                columns = list(zip(*reader))
            ixt = -1
            for i in range(len(columns)):
                if columns[i][0] == 'PERSON_ID':
                    for j in range(len(columns[i])):
                        if str(shooter) == columns[i][j]:
                            ixt = j
                            break
            for i in range(len(columns)):
                if columns[i][0] == 'DISPLAY_FIRST_LAST':
                    pname = columns[i][ixt]
                    break
            pname = pname.translate(None, string.punctuation)
            pname = pname.upper()
            for i in range(len(team.roster)):
                if team.roster[i].name == pname:
                    ix = i
                    break
            shot, loc = team.roster[ix].shoot()
            blka = team.stats[2]
            result_BLKA = np.random.choice([0, 1], p=[1 - (blka / 100), blka / 100])
            if result_BLKA == 1:
                chance = np.random.choice([0, 1])
                if chance == 1:  # turnover
                    total_tovs += 1
                    numPos -= 1
                    continue
            if shot == 1:
                if loc > 8:
                    score += 3
                    pts[pname] += 3
                    #toP = team.tname + ": " + pname + ' made a 3. '
                    #print(toP)
                else:
                    score += 2
                    pts[pname] += 2
                    #toP = team.tname + ": " + pname + ' made a 2. '
                    #print(toP)
            else:
                oreb = team.stats[3]
                result_OREB = np.random.choice([0, 1], p=[1 - (oreb / 100), oreb / 100])
                if result_OREB == 1:
                    continue
            numPos -= 1
        for p in pts.keys():
            toP = p + ': ' + str(pts[p])
            print(toP + ", ")
        ft = team.stats[4]
        toP = 'Total Freethrows: ' + str(int(round(ft)))
        print(toP + ", ")
        toP = 'Total Turnovers: ' + str(int(round(total_tovs)))
        print(toP + ", ")
        score += round(ft)
        return score


#class matchSim():
    '''def __init__(self, t1, t2):
        self.t1 = t1
        self.t2 = t2
        self.score = [0, 0]

    def gameRun(self):
        self.score[0] = self.posSim(100, self.t1)
        self.score[1] = self.posSim(100, self.t2)

    def posSim(self, numPos, team):
        score = 0
        while numPos > 0:
            tov = team.stats[1]
            result_TOV = np.random.choice([0, 1], p=[1 - (tov / 100), tov / 100])
            if result_TOV == 1:
                print('Turnover.', team.tname)
                numPos -= 1
                continue
            shooter = team.chooseShooter()
            pname = ''
            ix = -1
            with open('info/players.csv', 'r') as f:
                reader = csv.reader(f, delimiter=',')
                columns = list(zip(*reader))
            ixt = -1
            for i in range(len(columns)):
                if columns[i][0] == 'PERSON_ID':
                    for j in range(len(columns[i])):
                        if str(shooter) == columns[i][j]:
                            ixt = j
                            break
            for i in range(len(columns)):
                if columns[i][0] == 'DISPLAY_FIRST_LAST':
                    pname = columns[i][ixt]
                    break
            for i in range(len(team.roster)):
                if team.roster[i].name == pname:
                    ix = i
                    break
            shot, loc = team.roster[ix].shoot()
            blka = team.stats[2]
            result_BLKA = np.random.choice([0, 1], p=[1 - (blka / 100), blka / 100])
            if result_BLKA == 1:
                chance = np.random.choice([0, 1])
                if chance == 1:  # turnover
                    print(pname + "'s", 'shot was blocked. Turnover.', team.tname)
                    numPos -= 1
                    continue
                else:
                    print(pname + "'s", 'shot was blocked.', team.tname)
            if shot == 1:
                if loc > 8:
                    score += 3
                    print(pname, 'made a 3.', team.tname)
                else:
                    score += 2
                    print(pname, 'made a 2.', team.tname)
            else:
                oreb = team.stats[3]
                result_OREB = np.random.choice([0, 1], p=[1 - (oreb / 100), oreb / 100])
                if result_OREB == 1:
                    print('Offensive Rebound.', team.tname)
                    continue
            numPos -= 1
        ft = team.stats[4]
        print('Total Freethrows:', round(ft), team.tname)
        score += round(ft)
        return score'''



class Team():
    def __init__(self, tname, roster):
        self.tname = tname
        self.roster = roster
        #self.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36"
        self.getStats()
        self.pIDs = [p.id for p in roster]
        self.teamShots = 0.0
        for r in roster:
            self.teamShots += r.shots
        self.shotProbs = []
        for r in roster:
            self.shotProbs.append(r.shots / self.teamShots)

    def getStats(self):
        tov = 0.0
        blka = 0.0
        oreb = 0.0
        ftm = 0.0
        indices = []
        with open('info/player_stats100.csv', 'r') as f:
            reader = csv.reader(f, delimiter=',')
            columns = list(zip(*reader))
        for i in range(len(columns)):
            if columns[i][0] == 'pname':
                for r in self.roster:
                    name = r.name
                    for j in range(len(columns[i])):
                        mod = columns[i][j]
                        mod = mod.translate(None, string.punctuation)
                        mod = mod.upper()
                        if name == mod:
                            indices.append(j)
                            break
        for i in range(len(columns)):
            if columns[i][0] == 'tov_per_poss':
                for ix in indices:
                    tov += float(columns[i][ix])
            if columns[i][0] == 'blk_per_poss':
                for ix in indices:
                    blka += float(columns[i][ix])
            if columns[i][0] == 'orb_per_poss':
                for ix in indices:
                    oreb += float(columns[i][ix])
            if columns[i][0] == 'ft_per_poss':
                for ix in indices:
                    ftm += float(columns[i][ix])
        self.stats = [self.tname, tov, blka, oreb, ftm]

    def chooseShooter(self):
        #print(self.pIDs,self.shotProbs)
        x = np.random.choice(self.pIDs, p=self.shotProbs)
        #print(x)
        return x


class Player():
    def __init__(self, name):
        '''self.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36"
        self.shot_chart_url0 = ("http://stats.nba.com/stats/shotchartdetail?AheadBehind=&CFID=33&"
                                "CFPARAMS=2018-19&ClutchTime=&Conference=&ContextFilter=&Context"
                                "Measure=FGA&DateFrom=&DateTo=&Division=&EndPeriod=10&EndRange=28800&"
                                "GROUP_ID=&GameEventID=&GameID=&GameSegment=&GroupID=&GroupMode=&Group"
                                "Quantity=5&LastNGames=0&LeagueID=00&Location=&Month=0&OnOff=&Opponent"
                                "TeamID=0&Outcome=&PORound=0&Period=0&PlayerID=")

        self.shot_chart_url1 = ("&PlayerID1=&PlayerID2"
                                "=&PlayerID3=&PlayerID4=&PlayerID5=&PlayerPosition=&PointDiff=&Position=&"
                                "RangeType=0&RookieYear=&Season=2018-19&SeasonSegment=&SeasonType=Regular+"
                                "Season&ShotClockRange=&StartPeriod=1&StartRange=0&StarterBench=&TeamID=0&Vs"
                                "Conference=&VsDivision=&VsPlayerID1=&VsPlayerID2=&VsPlayerID3=&VsPlayerID4=&"
                                "VsPlayerID5=&VsTeamID=")
        '''
        self.name = name
        # player.PlayerList().info().to_csv('players.csv')
        with open('info/players.csv', 'r') as f:
            reader = csv.reader(f, delimiter=',')
            columns = list(zip(*reader))
        ix = -1
        for i in range(len(columns)):
            if columns[i][0] == 'DISPLAY_FIRST_LAST':
                for j in range(len(columns[i])):
                    mod = columns[i][j]
                    mod = mod.translate(None, string.punctuation)
                    mod = mod.upper()
                    #if columns[i][j] == 'Kawhi Leonard': print(self.name)
                    if self.name == mod:
                        ix = j
                        break
        if ix == -1: print(str(self.name))
        for i in range(len(columns)):
            if columns[i][0] == 'PERSON_ID':
                self.id = int(columns[i][ix])
                break
        #self.getData(str(self.id))
        self.zones_list = [(u'Less Than 8 ft.', u'Center(C)'),
                           (u'8-16 ft.', u'Center(C)'),
                           (u'8-16 ft.', u'Left Side(L)'),
                           (u'8-16 ft.', u'Right Side(R)'),
                           (u'16-24 ft.', u'Center(C)'),
                           (u'16-24 ft.', u'Left Side Center(LC)'),
                           (u'16-24 ft.', u'Left Side(L)'),
                           (u'16-24 ft.', u'Right Side Center(RC)'),
                           (u'16-24 ft.', u'Right Side(R)'),
                           (u'24+ ft.', u'Center(C)'),
                           (u'24+ ft.', u'Left Side Center(LC)'),
                           (u'24+ ft.', u'Left Side(L)'),
                           (u'24+ ft.', u'Right Side Center(RC)'),
                           (u'24+ ft.', u'Right Side(R)'),
                           (u'Back Court Shot', u'Back Court(BC)')]
        self.stats = self.loadData(self.id)
        self.shots = 0.0
        for s in self.stats:
            self.shots += s[1]
        self.shotLocs = []
        for s in self.stats:
            if self.shots > 0:
                self.shotLocs.append(s[1] / self.shots)
            else:
                self.shotLocs.append(0.0)
        self.shotAcc = []
        for s in self.stats:
            if s[1] > 0.0:
                self.shotAcc.append(s[0] / s[1])
            else:
                self.shotAcc.append(0.0)

    '''def getData(self, id):

        if path.exists('info/' + id + '.csv') is False:
            req = urllib2.Request(self.shot_chart_url0 + id + self.shot_chart_url1)
            req.add_header('USER-AGENT', self.userAgent)
            response = urllib2.urlopen(req).read()
            response = json.loads(response)
            headers = response['resultSets'][0]['headers']
            shots = response['resultSets'][0]['rowSet']

            with open('info/' + id + '.csv', mode='w', newline='') as f:
                writer = csv.writer(f, delimiter=',')
                writer.writerow(headers)
                for s in shots:
                    writer.writerow(s)
            #
            # response = requests.get(self.shot_chart_url0 + id +
            #                         self.shot_chart_url1, headers={"USER-AGENT": self.userAgent})
            # headers = response.json()['resultSets'][0]['headers']
            # shots = response.json()['resultSets'][0]['rowSet']
            # shot_df = pd.DataFrame(shots, columns=headers)
            # shot_df.to_csv('info/' + id + '.csv')'''

    def shoot(self):
        loc = np.random.choice(list(range(15)), p=self.shotLocs)
        chance = self.shotAcc[loc]
        return np.random.choice([0, 1], p=[1 - chance, chance]), loc

    def loadData(self, id):
        id = str(id)
        with open('info/' + id + '.csv', 'r') as f:
            reader = csv.reader(f, delimiter=',')
            columns = list(zip(*reader))
        indices = [-1, -1, -1]
        for i in range(len(columns)):
            if columns[i][0] == 'SHOT_ZONE_RANGE':
                indices[0] = i
            if columns[i][0] == 'SHOT_ZONE_AREA':
                indices[1] = i
            if columns[i][0] == 'SHOT_MADE_FLAG':
                indices[2] = i
            if -1 not in indices: break
        stats = []
        for i in range(15):
            stats.append([0, 0])
        for i, j, k in zip(columns[indices[0]], columns[indices[1]], columns[indices[2]]):
            if i == self.zones_list[0][0] and j == self.zones_list[0][1]:
                stats[0][1] += 1
                if k:
                    stats[0][0] += 1

            if i == self.zones_list[1][0] and j == self.zones_list[1][1]:
                stats[1][1] += 1
                if k:
                    stats[1][0] += 1

            if i == self.zones_list[2][0] and j == self.zones_list[2][1]:
                stats[2][1] += 1
                if k:
                    stats[2][0] += 1

            if i == self.zones_list[3][0] and j == self.zones_list[3][1]:
                stats[3][1] += 1
                if k:
                    stats[3][0] += 1

            if i == self.zones_list[4][0] and j == self.zones_list[4][1]:
                stats[4][1] += 1
                if k:
                    stats[4][0] += 1

            if i == self.zones_list[5][0] and j == self.zones_list[5][1]:
                stats[5][1] += 1
                if k:
                    stats[5][0] += 1

            if i == self.zones_list[6][0] and j == self.zones_list[6][1]:
                stats[6][1] += 1
                if k:
                    stats[6][0] += 1

            if i == self.zones_list[7][0] and j == self.zones_list[7][1]:
                stats[7][1] += 1
                if k:
                    stats[7][0] += 1

            if i == self.zones_list[8][0] and j == self.zones_list[8][1]:
                stats[8][1] += 1
                if k:
                    stats[8][0] += 1

            if i == self.zones_list[9][0] and j == self.zones_list[9][1]:
                stats[9][1] += 1
                if k:
                    stats[9][0] += 1

            if i == self.zones_list[10][0] and j == self.zones_list[10][1]:
                stats[10][1] += 1
                if k:
                    stats[10][0] += 1

            if i == self.zones_list[11][0] and j == self.zones_list[11][1]:
                stats[11][1] += 1
                if k:
                    stats[11][0] += 1

            if i == self.zones_list[12][0] and j == self.zones_list[12][1]:
                stats[12][1] += 1
                if k:
                    stats[12][0] += 1

            if i == self.zones_list[13][0] and j == self.zones_list[13][1]:
                stats[13][1] += 1
                if k:
                    stats[13][0] += 1

            if i == self.zones_list[14][0] and j == self.zones_list[14][1]:
                stats[14][1] += 1
                if k:
                    stats[14][0] += 1

        for i in range(9):
            stats[i].append(2)
        for i in range(9, 15):
            stats[i].append(3)
        return stats


def main():
    t1name = str(sys.argv[1])
    t1roster = str(sys.argv[2])
    invalid = False
    
    t2name = str(sys.argv[3])
    t2roster = str(sys.argv[4])

    #t1name = input('Enter Team 1 Name: ')
    #t1roster = input('Enter Team 1 Roster: ')
    if len(t1roster) > 1:
        t1roster = t1roster.split(', ')
    #t2name = input('Enter Team 2 Name: ')
    #t2roster = input('Enter Team 2 Roster: ')
    if len(t2roster) > 1:
        t2roster = t2roster.split(', ')
    
    for i in range(len(t1roster)):
        t1roster[i] = t1roster[i].translate(None, string.punctuation)
        t1roster[i] = t1roster[i].upper()
        
    for i in range(len(t2roster)):
        t2roster[i] = t2roster[i].translate(None, string.punctuation)
        t2roster[i] = t2roster[i].upper()
    
    t1roster = [Player(i) for i in t1roster]
    t2roster = [Player(i) for i in t2roster]
        
    team1 = Team(t1name, t1roster)
    team2 = Team(t2name, t2roster)
    sim = matchSim(team1, team2)
    sim.gameRun()
    score = "Final Score: " + str(int(round(sim.score[0]))) + " to " + str(int(round(sim.score[1])))
    print(score + ", ")
    if int(round(sim.score[0])) > int(round(sim.score[1])):
        winner = team1.tname + ' Wins!'
        print(winner)
    elif int(round(sim.score[0])) == int(round(sim.score[1])):
        print('Tie!')
    else:
        winner = team2.tname + ' Wins!'
        print(winner)
    #print(t1name,t1roster)
    sys.stdout.flush()
if __name__ == '__main__':
    main()
