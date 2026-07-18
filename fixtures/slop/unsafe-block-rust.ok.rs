fn read_checked(values: &[i32], index: usize) -> Option<i32> {
    values.get(index).copied()
}
