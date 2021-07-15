/*
 * Software Name : SuperCodingBall
 * Version: 1.0.0
 * SPDX-FileCopyrightText: Copyright (c) 2021 Orange
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * This software is distributed under the BSD 3-Clause "New" or "Revised" License,
 * the text of which is available at https://spdx.org/licenses/BSD-3-Clause.html
 * or see the "LICENSE.txt" file for more details.
 */

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ConnectionStatus, DayAndGames, Opponent} from '../../models/webcom-models';
import {OnlineService} from '../../services/online.service';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {CodeService} from '../../services/code.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {concatMap, finalize} from 'rxjs/operators';
import {LocalStorageService} from '../../services/local-storage.service';

@Component({
  selector: 'app-online-opponents',
  templateUrl: './online-opponents.component.html',
  styleUrls: ['./online-opponents.component.scss']
})

export class OnlineOpponentsComponent implements OnInit, OnDestroy {
  @ViewChild('replay_game') private replayGameContent: any;
  public ConnectionStatus = ConnectionStatus;
  private connectionStatusSubscription?: Subscription;
  opponents: Opponent[] = [];
  myGames: { [opponentId: string]: number; } = {};
  lastResult = 0;
  filteredOpponents: Opponent[] = [];
  personalRanking = 0;
  loading = false;

  #searchTerm = '';

  get searchTerm(): string {
    return this.#searchTerm;
  }

  set searchTerm(term: string) {
    this.#searchTerm = term;
    this.filteredOpponents = this.opponents.filter(opp => !term ||
      this.normalized(opp.userDisplay?.displayName ?? '').includes(this.normalized(term)));
  }

  private normalized(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  constructor(
    private router: Router,
    public modalService: NgbModal,
    public translate: TranslateService,
    private codeService: CodeService,
    public onlineService: OnlineService,
    private localStorageService: LocalStorageService
  ) {
  }

  ngOnInit(): void {
    if (this.onlineService.connectionStatus === ConnectionStatus.Connected) {
      this.loadData();
    }
    this.connectionStatusSubscription = this.onlineService.connectionStatusChanged.subscribe(
      status => {
        if (status === ConnectionStatus.Connected) {
          this.loadData();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.connectionStatusSubscription?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.onlineService.syncUserData(this.codeService.loadOwnXmlBlocksFromLocalStorage())
      .pipe(
        concatMap(() => this.onlineService.loadGamesAndRemoveOldOnes()),
        finalize(() => this.loading = false)
      )
      .subscribe(allGames => {
        this.computeOpponentsScore(allGames);
        // Opponents without userDisplay are opponents who have been challenged, but who didn't connect in the 15 days
        this.opponents = this.opponents.filter(opponent => !!opponent.userDisplay);
        this.computeRankings();
        this.filteredOpponents = this.opponents;
      });
  }

  private computeOpponentsScore(allGames: DayAndGames[]): void {
    this.opponents = [];
    const today = OnlineService.getUtcTimestamp(Date.now());
    this.myGames = allGames.find(dayAndGames => +dayAndGames.dayTimestamp === today)
        ?.games[this.onlineService.webcomId]
        ?.dailyGames
      ?? {};

    for (const dayAndGame of allGames) {
      for (const userId of Object.keys(dayAndGame.games)) {
        const userDailyRecap = dayAndGame.games[userId];
        let searchedUser = this.opponents.find(user => user.webcomId === userId);
        if (!searchedUser) {
          searchedUser = new Opponent(userId, userDailyRecap.userDisplay, 0, 0, +dayAndGame.dayTimestamp);
          this.opponents.push(searchedUser);
        } else if (+dayAndGame.dayTimestamp > searchedUser.lastSeen) {
          searchedUser.lastSeen = +dayAndGame.dayTimestamp;
          searchedUser.userDisplay = userDailyRecap.userDisplay;
        }
        if (!userDailyRecap.dailyGames) {
          continue;
        }
        for (const opponentId of Object.keys(userDailyRecap.dailyGames)) {
          const gameResult = userDailyRecap.dailyGames[opponentId];
          const searchedOpponent = this.opponents.find(opp => opp.webcomId === opponentId);
          if (!searchedOpponent) {
            this.opponents.push(new Opponent(opponentId, null, 2 - gameResult, 0, 0));
          } else {
            searchedOpponent.points += 2 - gameResult;
          }
          searchedUser.points += gameResult;
        }
      }
    }
  }

  private computeRankings(): void {
    this.opponents.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      } else if (a.lastSeen !== b.lastSeen) {
        return b.lastSeen - a.lastSeen;
      } else {
        return b.webcomId.localeCompare(a.webcomId);
      }
    });

    let formerPoints = -1;
    let currentRanking = 0;
    let exAequoNumber = 1;
    for (const opponent of this.opponents) {
      if (formerPoints !== opponent.points) {
        currentRanking += exAequoNumber;
        exAequoNumber = 1;
        formerPoints = opponent.points;
      } else {
        exAequoNumber++;
      }
      opponent.ranking = currentRanking;
    }

    this.personalRanking = this.opponents.find(opp => opp.webcomId === this.onlineService.webcomId)?.ranking ?? 0;
  }

  play(opponentId: string): void {
    if (opponentId === this.onlineService.webcomId) {
      return;
    }
    this.lastResult = this.myGames[opponentId];
    if (this.lastResult !== undefined) {
      this.modalService.open(this.replayGameContent)
        .result.then((replayValidated: boolean) => {
        if (replayValidated) {
          this.router.navigate([`/code/online/${opponentId}`]);
        }
      });
    } else {
      this.router.navigate([`/code/online/${opponentId}`]);
    }
  }

  updateUserDisplayName(nickname: string): void {
    this.onlineService.updateUserDisplayName(nickname)
      .subscribe(() => this.loadData());
  }

  uploadBlocks(): void {
    this.onlineService.updateUserBlocks(this.codeService.loadOwnXmlBlocksFromLocalStorage())
      .subscribe(() => this.modalService.dismissAll());
  }

  downloadBlocks(): void {
    this.codeService.loadOwnXmlBlocksFromServer()
      .then(blocks => {
        this.localStorageService.saveXmlBlocks(blocks);
        this.modalService.dismissAll();
      });
  }

  removeAccount(): void {
    this.loading = true;
    this.onlineService.removeAccount()
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => null, () => null, () => this.onlineService.disconnect());
  }
}