import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@app/core/service/users.service';
import { Location } from '@angular/common';
import { AuthenticationService } from '@app/core';

@Component({
	selector: 'app-user-details',
	templateUrl: './user-details.component.html',
	styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
	/**
	 * store the user details
	 */
	data: any;
	/**
	 * user types to display instead of role which is number
	 */
	userTypes = [ 'Ofițer de intervenție', 'Administratorul instituțional', 'Administrator ONG', 'Administrator General'];
	/**
	 * flag for HTML to display loading animation
	 */
	loading = false;

	constructor(private route: ActivatedRoute,
		private authService: AuthenticationService,
		private router: Router,
		private usersService: UsersService,
		private location: Location) { }

	ngOnInit() {
		this.usersService.getUser(this.route.snapshot.paramMap.get('id')).subscribe(response => {
			this.data = response;
		});
	}
/**
	 * send to edit page
	 */
	edit() {
		this.router.navigate(['/users/edit/' + this.data._id]);
	}
/**
	 * send to delete page
	 */
	delete() {
		/**
	 * check if is the current user deleting his own account
	 */
		if (this.authService.user._id === this.data._id) {
			if (confirm('Sunteți sigur că doriți să vă ștergeți contul?')) {
				this.loading = true;
				this.usersService.deleteUser(this.data._id).subscribe(response => {
					this.loading = false;
					this.authService.setCredentials();
					this.router.navigateByUrl('/login');
				}, () => {
					this.location.back();
				});
			}
		} else {
			if (confirm('Sunteți sigur că doriți să ștergeți această intrare? Odată ștearsă nu va mai putea fi recuperată.')) {
				this.loading = true;
				this.usersService.deleteUser(this.data._id).subscribe(response => {
					this.loading = false;
					this.location.back();
				}, () => {
					this.location.back();
				});
			}
		}
	}
}
