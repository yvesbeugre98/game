/*
 * Les différentes routes de l'app
 */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HowtoComponent} from './components/howto/howto.component';
import {AboutComponent} from './components/about/about.component';
import {PrivacyComponent} from './components/privacy/privacy.component';
import {TermsComponent} from './components/terms/terms.component';
import {LegalComponent} from './components/legal/legal.component';
import {OfflineOpponentsComponent} from './components/offline-opponents/offline-opponents.component';
import {OnlineOpponentsComponent} from './components/online-opponents/online-opponents.component';
import {BlocklyComponent} from './components/blockly/blockly.component';
import {GameComponent} from './components/game/game.component';
import {IsStrongGuard} from './services/is-strong-guard';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'howto', component: HowtoComponent},
  {path: 'about', component: AboutComponent},
  {path: 'privacy', component: PrivacyComponent},
  {path: 'terms', component: TermsComponent},
  {path: 'legal', component: LegalComponent},
  {path: 'offline-opponents', component: OfflineOpponentsComponent},
  {path: 'online-opponents', component: OnlineOpponentsComponent, canActivate: [IsStrongGuard]},
  {path: 'code/offline/:id', component: BlocklyComponent},
  {path: 'code/online/:id', component: BlocklyComponent, canActivate: [IsStrongGuard]},
  {path: 'play/offline/:id', component: GameComponent},
  {path: 'play/online/:id', component: GameComponent, canActivate: [IsStrongGuard]},
  {path: '**', redirectTo: '/home', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
