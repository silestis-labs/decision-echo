/** Memory-only authorization declaration; never verifies an organization's approval. */
export class SharingAuthorization {
 authorized=false;
 private pending:(()=>void)|null=null;
 request(action:()=>void){this.pending=action;}
 cancel(){this.pending=null;}
 continue(acknowledged:boolean){if(!acknowledged||!this.pending)return;const action=this.pending;this.pending=null;this.authorized=true;action();}
 reset(){this.authorized=false;this.cancel();}
}
