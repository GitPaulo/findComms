import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LargeRequestDialogComponent } from './large-request-dialog.component';

describe('LargeRequestDialogComponent', () => {
  let component: LargeRequestDialogComponent;
  let fixture: ComponentFixture<LargeRequestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LargeRequestDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LargeRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
