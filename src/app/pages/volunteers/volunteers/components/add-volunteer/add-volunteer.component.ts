import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { VolunteerService } from '../../../volunteers.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, merge, Subject } from 'rxjs';
import {
	debounceTime,
	distinctUntilChanged,
	map,
	filter,
	switchMap,
} from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { CitiesCountiesService } from '../../../../../core/service/cities-counties.service';
import { OrganisationService } from '../../../../organisations/organisations.service';
import { AuthenticationService, FiltersService } from '@app/core';
import { EmailValidation } from '@app/core/validators/email-validation';
import { PhoneValidation } from '@app/core/validators/phone-validation';
import { Location } from '@angular/common';
import { SsnValidation } from '@app/core/validators/ssn-validation';

@Component({
	selector: 'app-add-volunteer',
	templateUrl: './add-volunteer.component.html',
	styleUrls: ['./add-volunteer.component.scss']
})

export class AddVolunteerComponent implements OnInit {
	form: FormGroup;
	coursename: string;
	acreditedby: string;
	obtained: string;
	countyid: string;
	volunteer: any;
	fixedOrg: any = undefined;
	cityPlaceholder = 'Selectați mai întâi județul';

	@ViewChild('instance', { static: true }) instance: NgbTypeahead;
	focus$ = new Subject<string>();
	click$ = new Subject<string>();

	@ViewChild('instance', { static: true }) instance1: NgbTypeahead;
	focus1$ = new Subject<string>();
	click1$ = new Subject<string>();

	@ViewChild('instance', { static: true }) instance2: NgbTypeahead;
	focus2$ = new Subject<string>();
	click2$ = new Subject<string>();
	edit = false;

	loading = false;
	loadingCities = false;

	constructor(
		public volunteerService: VolunteerService,
		private filterService: FiltersService,
		private router: Router,
		private route: ActivatedRoute, private location: Location,
		private fb: FormBuilder,
		private citiesandCounties: CitiesCountiesService,
		public authService: AuthenticationService) {
			const navigation = this.router.getCurrentNavigation();
			if (navigation && navigation.extras && navigation.extras.state) {
				this.fixedOrg = navigation.extras.state.ngo;
				console.log(this.fixedOrg);
			}
		}

	ngOnInit() {
		this.getVolunteerDetails(this.route.snapshot.paramMap.get('id'));
		this.form = this.fb.group({
			name: ['', Validators.required],
			ssn: ['', [Validators.required, SsnValidation.ssnValidation]],
			email: ['', [Validators.required, EmailValidation.emailValidation]],
			phone: ['', [Validators.required, PhoneValidation.phoneValidation]],
			address: [''],
			job: [''],
			county: ['', Validators.required],
			city: [{ value: '', disabled: true }, Validators.required],
			organisation: this.authService.is('NGO') ?
								[{value: {name: this.authService.user.organisation.name, _id: this.authService.user.organisation._id},
									disabled: true }, Validators.required]
								:	this.fixedOrg ?
									[{value: {name: this.fixedOrg.name, _id: this.fixedOrg._id},
										disabled: false }, Validators.required]
										:	[{value: '' , disabled: false }, Validators.required],
			courses: this.fb.array([]),
			comments: ['']
		});
	}

	getVolunteerDetails(volId: string) {
		if (volId) {
			this.edit = true;
			this.volunteerService.getVolunteer(volId).subscribe(data => {
				this.volunteer = data;
				this.countyid = this.volunteer.county._id;
				this.form = this.fb.group({
					name: [this.volunteer.name, Validators.required],
					ssn: [this.volunteer.ssn, [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
					email: [this.volunteer.email, [Validators.required, EmailValidation.emailValidation]],
					phone: [this.volunteer.phone, [Validators.required, PhoneValidation.phoneValidation]],
					address: this.volunteer.address,
					job: this.volunteer.job,
					county: [this.volunteer.county, Validators.required],
					city: [this.volunteer.city, Validators.required],
					organisation: [{value: this.volunteer.organisation, disabled: this.authService.is('NGO') }, Validators.required],
					courses: this.fb.array(this.volunteer.courses),
					comments: this.volunteer.comments
				});
			});
		}
	}

	get f() {
		return this.form.controls;
	}

	get c() {
		return this.f.courses as FormArray;
	}

	formatter = (result: { name: string }) => result.name;

	searchorganisation = (text$: Observable<string>) => {
		const debouncedText$ = text$.pipe(
			debounceTime(200),
			distinctUntilChanged()
		);

		const clicksWithClosedPopup$ = this.click$.pipe(
			filter(() => !this.instance.isPopupOpen())
		);

		const inputFocus$ = this.focus$;
		return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
			switchMap((term: string) => {
				return this.filterService.getorganisationbyName(term);
			}));
	}

	searchcounty = (text$: Observable<string>) => {
		const debouncedText$ = text$.pipe(
			debounceTime(200),
			distinctUntilChanged()
		);
		const clicksWithClosedPopup$ = this.click1$.pipe(
			filter(() => !this.instance1.isPopupOpen())
		);
		const inputFocus$ = this.focus1$;
		return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
			switchMap((term: string) => {
				return this.citiesandCounties.getCounties(term).pipe(
					map((response: {data: any[], pager: any}) => {
						console.log(response);
						return response.data;
					})
				);
			})
		);
	}

	searchcity = (text$: Observable<string>) => {
		const debouncedText$ = text$.pipe(
			debounceTime(500),
			distinctUntilChanged()
		);
		const clicksWithClosedPopup$ = this.click2$.pipe(
			filter(() => !this.instance2.isPopupOpen())
		);
		const inputFocus$ = this.focus2$;
		return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
			switchMap((term: string) => {
				if (this.countyid) {
					this.loadingCities = true;
					this.cityPlaceholder = 'Căutare...';

					return this.citiesandCounties.getCitiesbyCounty(this.countyid, term).pipe(
						map((response: {data: any[], pager: any}) => {
							this.cityPlaceholder = 'Alegeți Orașul';
							this.loadingCities = false;
							return response.data;
						})
					);
				} else {
					return [];
				}
			})
		);
	}

	addCourse() {
		if (!(this.coursename === '' || this.acreditedby === '')) {
			this.c.push(
				this.fb.group({
					name: this.coursename,
					obtained: this.obtained,
					acreditedby: this.acreditedby
				})
			);
			this.coursename = null;
			this.acreditedby = null;
		}
	}

	removeCourse(index: number) {
		const control = <FormArray>this.form.controls.courses;

		// const objIndex = this.data.findIndex(((obj: any) => obj.key === 'courses'));
		// this.data[objIndex].value.splice(index, 1);
		control.removeAt(index);
	}

	selectedCounty(val: any) {
		this.form.controls.county.markAsTouched();
		if (val.item && val.item._id) {
			this.countyid = val.item._id;
			this.form.patchValue({county: val.item});
			this.form.controls.city.enable();
			this.loadingCities = true;
			this.cityPlaceholder = 'Căutare...';
		} else if (this.form.controls.county.value.name && val !== this.form.controls.county.value.name) {
			this.form.patchValue({county: '', city: ''});
		}
	}

	selectedCity(val: { item: any }) {
		this.form.controls.city.markAsTouched();
		this.form.patchValue({city: val.item});
	}

	selectedorganisation(val: { item: any }) {
		this.form.controls.organisation.markAsTouched();
		this.form.patchValue({organisation: val.item});
	}

	/**
	 * Send data from form to server. If success close page
	 */
	onSubmit() {
		this.loading = true;
		const volunteer = {...this.form.value};

		volunteer.ssn = volunteer.ssn.toString();
		volunteer.county = volunteer.county._id;
		volunteer.city = volunteer.city._id;
		volunteer.organisation_id = volunteer.organisation._id;

		if (this.edit) {
			this.volunteerService.editVolunteer(volunteer._id, volunteer).subscribe(() => {
				this.loading = false;
				this.location.back();
			}, () => {
				this.loading = false;
			});
		} else {
			this.volunteerService.addVolunteer(volunteer).subscribe(() => {
				this.loading = false;
				this.location.back();
			}, () => {
				this.loading = false;
			});
		}
	}
}
