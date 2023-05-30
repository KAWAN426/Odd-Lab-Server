User {
id: UniqeString,
name: String,
profileImg: String
}
Lab {
id: UniqeString,
title: String,
makerId: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
like:String[]
createdAt:Time,
updatedAt:Time
}
Objects {
id:String,
name:String,
img:String
}
UpdateLab {
title: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
}
CreateLab {
title: String,
makerId: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
}

-Lab

1. getListOrderedByLike() => Lab[]
2. getListOrderedByNewest() => Lab[]
3. getOneById(id:String) => Lab
4. getListByMakerId(makerId:String) => Lab[]
5. createLab(data:CreateLab)
6. updateLabObject(data:UpdateLab)
7. updateLabLike(id:String,userID:String)
8. DeleteLabById(id:String)

-User

1. getUser(id:String) => User
2. createUser(name:String,profileImg:String)
3. updateUser(name:String,profileImg:String)
4. deleteUser(id:String)

Test {
id:UniqeString,
title:String,
description:String
}

-Test

1. getTest(id:String) => Test
2. createTest(data:Test)
