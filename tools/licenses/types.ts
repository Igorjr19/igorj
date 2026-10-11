export interface PackageLicenseFile {
  readonly package: string;
  readonly file: string;
}

export interface RemoteLicenseFile {
  readonly url: string;
  readonly sha256: string;
}

export interface ThirdPartyEntry {
  readonly name: string;
  readonly license: string;
  readonly homepage: string;
  readonly text: PackageLicenseFile | RemoteLicenseFile;
}

export interface Notice {
  readonly name: string;
  readonly license: string;
  readonly homepage: string;
  readonly text: string;
}
