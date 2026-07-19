class MyService {
  constructor(dep) {
    this.dep = dep;
  }
  doThing(id) {
    const raw = this.dep.doThing(id);
    return normalize(raw);
  }
}
