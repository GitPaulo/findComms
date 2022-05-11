import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LargeRequestDialogData } from "../app.component";

@Component({
  selector: "app-large-request-dialog",
  templateUrl: "./large-request-dialog.component.html",
  styleUrls: ["./large-request-dialog.component.less"],
})
export class LargeRequestDialogComponent implements OnInit {
  domain: number;
  constructor(
    public dialogRef: MatDialogRef<LargeRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LargeRequestDialogData
  ) {
    this.domain = data.domain;
  }

  ngOnInit(): void {}
}
